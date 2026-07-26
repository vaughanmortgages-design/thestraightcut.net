import crypto from "node:crypto";

export const WEBHOOK_EVENT = "affiliate-vault.updated";
export const WEBHOOK_SIGNATURE_HEADER = "x-affiliate-vault-signature";
export const WEBHOOK_TIMESTAMP_HEADER = "x-affiliate-vault-timestamp";
export const WEBHOOK_EVENT_ID_HEADER = "x-affiliate-vault-event-id";
export const DEFAULT_SPREADSHEET_ID =
  "1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo";
export const DEFAULT_TAB_NAME = "Affiliate Link Vault";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;
const MAX_DISPATCH_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [500, 1_500, 3_500];

function jsonResponse(status, payload, headers = {}) {
  return new Response(`${JSON.stringify(payload)}\n`, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}

function safeLog(logger, level, event, fields = {}) {
  const method = typeof logger?.[level] === "function" ? level : "log";
  logger?.[method]?.(
    JSON.stringify({
      component: "affiliate-vault-webhook",
      level,
      event,
      ...fields
    })
  );
}

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(left, "hex"),
    Buffer.from(right, "hex")
  );
}

export function signWebhookBody(secret, timestamp, rawBody) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
}

export function verifyWebhookSignature({
  secret,
  timestamp,
  rawBody,
  signature,
  now = Date.now()
}) {
  if (!secret) return { valid: false, reason: "server secret is not configured" };
  if (!/^\d{10}$/.test(String(timestamp ?? ""))) {
    return { valid: false, reason: "invalid timestamp" };
  }
  const age = Math.abs(Math.floor(now / 1000) - Number(timestamp));
  if (age > MAX_TIMESTAMP_SKEW_SECONDS) {
    return { valid: false, reason: "stale timestamp" };
  }
  const supplied = String(signature ?? "").replace(/^sha256=/i, "");
  const expected = signWebhookBody(secret, timestamp, rawBody);
  if (!safeEqualHex(supplied, expected)) {
    return { valid: false, reason: "signature mismatch" };
  }
  return { valid: true, reason: "" };
}

function validatePayload(payload, eventId, env) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return ["body must be a JSON object"];
  }
  if (payload.event !== WEBHOOK_EVENT) {
    errors.push(`event must be ${WEBHOOK_EVENT}`);
  }
  if (payload.event_id !== eventId) {
    errors.push("body event_id must match the event ID header");
  }
  if (
    payload.spreadsheet_id !==
    (env.AFFILIATE_VAULT_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID)
  ) {
    errors.push("unexpected spreadsheet_id");
  }
  if (
    payload.tab !==
    (env.AFFILIATE_VAULT_SHEET_NAME || DEFAULT_TAB_NAME)
  ) {
    errors.push("unexpected tab");
  }
  if (
    !payload.occurred_at ||
    Number.isNaN(Date.parse(String(payload.occurred_at)))
  ) {
    errors.push("occurred_at must be an ISO-8601 timestamp");
  }
  return errors;
}

function retryableStatus(status) {
  return [408, 425, 429].includes(status) || status >= 500;
}

function retryDelay(response, attempt) {
  const retryAfterHeader = response?.headers?.get?.("retry-after");
  const retryAfter = Number(retryAfterHeader);
  if (
    retryAfterHeader !== null &&
    retryAfterHeader !== undefined &&
    Number.isFinite(retryAfter) &&
    retryAfter >= 0
  ) {
    return Math.min(retryAfter * 1_000, 10_000);
  }
  return RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
}

async function dispatchRefresh({
  payload,
  env,
  fetchImpl,
  sleep,
  logger
}) {
  const token = env.GITHUB_REPOSITORY_DISPATCH_TOKEN;
  if (!token) {
    throw new Error("GITHUB_REPOSITORY_DISPATCH_TOKEN is not configured");
  }
  const repository =
    env.GITHUB_REPOSITORY || "vaughanmortgages-design/thestraightcut.net";
  const url = `https://api.github.com/repos/${repository}/dispatches`;

  for (let attempt = 1; attempt <= MAX_DISPATCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-github-api-version": "2022-11-28"
        },
        body: JSON.stringify({
          event_type: "affiliate-vault-updated",
          client_payload: {
            event_id: payload.event_id,
            occurred_at: payload.occurred_at,
            spreadsheet_id: payload.spreadsheet_id,
            tab: payload.tab,
            change: payload.change ?? null
          }
        }),
        signal: AbortSignal.timeout(10_000)
      });
      if (response.status === 204) return { attempts: attempt };
      if (!retryableStatus(response.status) || attempt === MAX_DISPATCH_ATTEMPTS) {
        const error = new Error(
          `GitHub repository dispatch returned HTTP ${response.status}`
        );
        error.retryable = retryableStatus(response.status);
        throw error;
      }
      const delay = retryDelay(response, attempt);
      safeLog(logger, "warn", "dispatch_retry", {
        eventId: payload.event_id,
        attempt,
        status: response.status,
        delayMs: delay
      });
      await sleep(delay);
    } catch (error) {
      if (error.retryable === false || attempt === MAX_DISPATCH_ATTEMPTS) {
        throw error;
      }
      const delay = RETRY_DELAYS_MS[attempt - 1];
      safeLog(logger, "warn", "dispatch_retry", {
        eventId: payload.event_id,
        attempt,
        reason: "network_or_timeout",
        delayMs: delay
      });
      await sleep(delay);
    }
  }
  throw new Error("GitHub repository dispatch exhausted retries");
}

export function createAffiliateVaultWebhook({
  getEventStore,
  fetchImpl = fetch,
  sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  now = () => Date.now(),
  env = process.env,
  logger = console
}) {
  if (typeof getEventStore !== "function") {
    throw new Error("getEventStore is required");
  }

  return async function affiliateVaultWebhook(request) {
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "method_not_allowed" }, { allow: "POST" });
    }
    if (
      !String(request.headers.get("content-type") ?? "")
        .toLowerCase()
        .startsWith("application/json")
    ) {
      return jsonResponse(415, { error: "unsupported_media_type" });
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      safeLog(logger, "error", "request_rejected", { reason: "body_too_large" });
      return jsonResponse(413, { error: "body_too_large" });
    }

    const eventId = request.headers.get(WEBHOOK_EVENT_ID_HEADER) ?? "";
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(eventId)) {
      safeLog(logger, "error", "request_rejected", { reason: "invalid_event_id" });
      return jsonResponse(400, { error: "invalid_event_id" });
    }

    const verification = verifyWebhookSignature({
      secret: env.AFFILIATE_VAULT_WEBHOOK_SECRET,
      timestamp: request.headers.get(WEBHOOK_TIMESTAMP_HEADER),
      rawBody,
      signature: request.headers.get(WEBHOOK_SIGNATURE_HEADER),
      now: now()
    });
    if (!verification.valid) {
      safeLog(logger, "error", "authentication_failed", {
        eventId,
        reason: verification.reason
      });
      return jsonResponse(401, { error: "invalid_signature" });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      safeLog(logger, "error", "request_rejected", {
        eventId,
        reason: "invalid_json"
      });
      return jsonResponse(400, { error: "invalid_json" });
    }

    const payloadErrors = validatePayload(payload, eventId, env);
    if (payloadErrors.length) {
      safeLog(logger, "error", "request_rejected", {
        eventId,
        reason: "invalid_payload",
        errors: payloadErrors
      });
      return jsonResponse(400, {
        error: "invalid_payload",
        details: payloadErrors
      });
    }

    const eventKey = `events/${crypto.createHash("sha256").update(eventId).digest("hex")}`;
    const store = getEventStore();
    let claimed;
    try {
      claimed = await store.setJSON(
        eventKey,
        {
          eventId,
          status: "processing",
          receivedAt: new Date(now()).toISOString()
        },
        { onlyIfNew: true }
      );
    } catch (error) {
      safeLog(logger, "error", "event_claim_failed", {
        eventId,
        message: error.message
      });
      return jsonResponse(
        503,
        { error: "idempotency_store_unavailable", event_id: eventId },
        { "retry-after": "60" }
      );
    }
    if (!claimed.modified) {
      safeLog(logger, "info", "duplicate_ignored", { eventId });
      return jsonResponse(202, { status: "duplicate_ignored", event_id: eventId });
    }

    let delivery;
    try {
      delivery = await dispatchRefresh({
        payload,
        env,
        fetchImpl,
        sleep,
        logger
      });
    } catch (error) {
      safeLog(logger, "error", "dispatch_failed", {
        eventId,
        message: error.message
      });
      try {
        await store.setJSON(
          `failures/${crypto.createHash("sha256").update(eventId).digest("hex")}/${now()}`,
          {
            eventId,
            failedAt: new Date(now()).toISOString(),
            message: error.message
          },
          { onlyIfNew: true }
        );
        await store.delete(eventKey);
      } catch (storageError) {
        safeLog(logger, "error", "failure_log_write_failed", {
          eventId,
          message: storageError.message
        });
      }
      return jsonResponse(
        503,
        { error: "refresh_dispatch_failed", event_id: eventId },
        { "retry-after": "60" }
      );
    }

    try {
      await store.setJSON(eventKey, {
        eventId,
        status: "dispatched",
        receivedAt: new Date(now()).toISOString(),
        attempts: delivery.attempts
      });
    } catch (error) {
      safeLog(logger, "error", "completion_log_write_failed", {
        eventId,
        message: error.message
      });
    }
    safeLog(logger, "info", "dispatch_accepted", {
      eventId,
      attempts: delivery.attempts
    });
    return jsonResponse(202, {
      status: "accepted",
      event_id: eventId,
      attempts: delivery.attempts
    });
  };
}
