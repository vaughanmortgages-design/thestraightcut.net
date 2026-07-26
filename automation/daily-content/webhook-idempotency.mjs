#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const MAX_PROCESSED_EVENTS = 100;

export function hasProcessedWebhookEvent(state, eventId) {
  if (!eventId) return false;
  return (state.processedWebhookEvents ?? []).includes(eventId);
}

export function markWebhookEventProcessed(state, eventId) {
  if (!eventId || hasProcessedWebhookEvent(state, eventId)) return state;
  return {
    ...state,
    processedWebhookEvents: [
      ...(state.processedWebhookEvents ?? []),
      eventId
    ].slice(-MAX_PROCESSED_EVENTS)
  };
}

async function appendOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  await fs.appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, "utf8");
}

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const action = process.argv[2];
  const eventId = process.env.AFFILIATE_VAULT_EVENT_ID || "";
  const statePath = new URL("./state.json", import.meta.url);
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));

  if (action === "check") {
    const duplicate = hasProcessedWebhookEvent(state, eventId);
    await appendOutput("duplicate", String(duplicate));
    console.log(
      eventId
        ? `[affiliate-vault-webhook] event ${eventId}: ${duplicate ? "duplicate" : "new"}`
        : "[affiliate-vault-webhook] non-webhook run"
    );
  } else if (action === "mark") {
    if (eventId) {
      await fs.writeFile(
        statePath,
        `${JSON.stringify(markWebhookEventProcessed(state, eventId), null, 2)}\n`,
        "utf8"
      );
      console.log(`[affiliate-vault-webhook] event ${eventId}: marked processed`);
    }
  } else {
    throw new Error("Usage: webhook-idempotency.mjs <check|mark>");
  }
}
