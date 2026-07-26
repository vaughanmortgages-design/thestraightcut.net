import { getStore } from "@netlify/blobs";
import { createAffiliateVaultWebhook } from "../../automation/daily-content/webhook-core.mjs";

const handler = createAffiliateVaultWebhook({
  getEventStore: () => getStore("affiliate-vault-webhook-events")
});

export default handler;
