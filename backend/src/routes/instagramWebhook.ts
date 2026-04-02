/**
 * Instagram Webhook Routes — verification + event ingestion.
 *
 * GET  /  — Meta webhook verification handshake
 * POST /  — Receive webhook events, respond 200 immediately, process async
 */
import { Router } from "express";
import { verifySignature, parseWebhookEvent } from "../lib/instagram/webhookHandler.js";
import type { ParsedEvent } from "../lib/instagram/webhookHandler.js";
import { handleInstagramMessage } from "../bublAgent.js";

export const instagramWebhookRouter = Router();

// ── Deduplication ──────────────────────────────────────────────────
const recentMids = new Set<string>();

function isDuplicate(mid: string): boolean {
  if (!mid || recentMids.has(mid)) return true;
  recentMids.add(mid);
  setTimeout(() => recentMids.delete(mid), 60_000);
  return false;
}

// ── GET — Webhook verification ──────────────────────────────────────

instagramWebhookRouter.get("/", (req, res) => {
  const mode = req.query["hub.mode"] as string | undefined;
  const token = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"] as string | undefined;

  const verifyToken = process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[IG Webhook] Verification succeeded");
    return res.status(200).send(challenge);
  }

  console.warn("[IG Webhook] Verification failed — token mismatch");
  return res.status(403).send("Forbidden");
});

// ── POST — Receive events ───────────────────────────────────────────

instagramWebhookRouter.post("/", (req, res) => {
  // 1. Signature verification
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const rawBody =
    typeof (req as any).rawBody === "string"
      ? (req as any).rawBody
      : JSON.stringify(req.body);

  if (!signature || !verifySignature(rawBody, signature)) {
    console.warn("[IG Webhook] Signature mismatch — processing anyway (dev mode)");
    console.warn("[IG Webhook] sig:", signature?.slice(0, 30), "rawBody type:", typeof (req as any).rawBody, "body keys:", Object.keys(req.body));
    // In production, uncomment: return res.status(403).send("Invalid signature");
  }

  // Log raw payload for debugging
  console.log("[IG Webhook] Raw payload:", JSON.stringify(req.body, null, 2));

  // 2. Respond 200 immediately (Meta requires < 5 s)
  res.sendStatus(200);

  // 3. Parse and process events asynchronously (fire-and-forget)
  try {
    const events: ParsedEvent[] = parseWebhookEvent(req.body);

    for (const event of events) {
      processEventAsync(event).catch((err) =>
        console.error("[IG Webhook] Error processing event:", err),
      );
    }
  } catch (err) {
    console.error("[IG Webhook] Error parsing webhook payload:", err);
  }
});

// ── Async event processor ────────────────────────────────────────────

async function processEventAsync(event: ParsedEvent): Promise<void> {
  // Deduplicate events that carry a mid
  if ("mid" in event && isDuplicate(event.mid)) {
    console.log(`[IG Webhook] Skipping duplicate mid=${event.mid}`);
    return;
  }

  switch (event.type) {
    case "message":
      console.log(
        `[IG Webhook] Message from ${event.senderId}: "${event.text.slice(0, 80)}"${event.ref ? ` (ref=${event.ref})` : ""}`,
      );
      await handleInstagramMessage(event.senderId, event.text, event.ref);
      break;

    case "referral":
      console.log(
        `[IG Webhook] Referral from ${event.senderId}: ref=${event.ref}`,
      );
      await handleInstagramMessage(event.senderId, "", event.ref);
      break;

    case "image":
      console.log(
        `[IG Webhook] Image from ${event.senderId}: ${event.url.slice(0, 80)}`,
      );
      await handleInstagramMessage(event.senderId, "[sent an image]", event.ref);
      break;

    case "quick_reply":
      console.log(
        `[IG Webhook] Quick reply from ${event.senderId}: payload=${event.payload}`,
      );
      await handleInstagramMessage(event.senderId, event.payload);
      break;

    case "reaction":
      // TODO: handle reactions (e.g. sentiment tracking)
      console.log(
        `[IG Webhook] Reaction from ${event.senderId}: ${event.emoji} (${event.action})`,
      );
      break;

    case "seen":
      // Ignored — no action needed for read receipts
      break;
  }
}
