/**
 * Instagram Webhook Handler — parses incoming webhook payloads
 * from Meta and returns typed event objects.
 */
import crypto from "crypto";

// ── Types ───────────────────────────────────────────────────────────

export type ParsedEvent =
  | { type: "message"; senderId: string; text: string; mid: string; ref?: string; timestamp: number }
  | { type: "image"; senderId: string; url: string; mid: string; ref?: string; timestamp: number }
  | { type: "quick_reply"; senderId: string; payload: string; mid: string; timestamp: number }
  | { type: "reaction"; senderId: string; mid: string; emoji: string; action: "react" | "unreact"; timestamp: number }
  | { type: "seen"; senderId: string; watermark: number; timestamp: number }
  | { type: "referral"; senderId: string; ref: string; timestamp: number };

// ── Signature verification ──────────────────────────────────────────

/**
 * Verify X-Hub-Signature-256 header against the raw request body.
 * Meta signs every payload with HMAC-SHA256 using your app secret.
 */
export function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.error("[IG Webhook] META_APP_SECRET is not set — cannot verify signature");
    return false;
  }

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  } catch {
    // Lengths differ — signature is invalid
    return false;
  }
}

// ── Payload parsing ─────────────────────────────────────────────────

/**
 * Parse an Instagram webhook payload into an array of typed events.
 *
 * Payload shape:
 * ```json
 * {
 *   "object": "instagram",
 *   "entry": [{
 *     "id": "page_id",
 *     "messaging": [{
 *       "sender": { "id": "IGSID" },
 *       "recipient": { "id": "page_igsid" },
 *       "timestamp": 1234567890,
 *       "message": { "mid": "xxx", "text": "hello" },
 *       "referral": { "ref": "invite_abc123" }
 *     }]
 *   }]
 * }
 * ```
 */
export function parseWebhookEvent(body: any): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  if (body?.object !== "instagram" || !Array.isArray(body.entry)) {
    return events;
  }

  for (const entry of body.entry) {
    const messaging: any[] = entry.messaging ?? [];

    for (const evt of messaging) {
      const senderId: string = evt.sender?.id;
      const timestamp: number = evt.timestamp ?? Date.now();

      if (!senderId) continue;

      // ── Reaction ────────────────────────────────────────────
      if (evt.reaction) {
        events.push({
          type: "reaction",
          senderId,
          mid: evt.reaction.mid ?? "",
          emoji: evt.reaction.emoji ?? "",
          action: evt.reaction.action === "unreact" ? "unreact" : "react",
          timestamp,
        });
        continue;
      }

      // ── Read receipt (messaging_seen) ───────────────────────
      if (evt.read) {
        events.push({
          type: "seen",
          senderId,
          watermark: evt.read.watermark ?? timestamp,
          timestamp,
        });
        continue;
      }

      // ── Standalone referral (no message attached) ───────────
      if (evt.referral && !evt.message) {
        events.push({
          type: "referral",
          senderId,
          ref: evt.referral.ref ?? "",
          timestamp,
        });
        continue;
      }

      // ── Message events ──────────────────────────────────────
      if (evt.message) {
        const msg = evt.message;
        const mid: string = msg.mid ?? "";
        const ref: string | undefined = evt.referral?.ref;

        // Quick reply postback
        if (msg.quick_reply?.payload) {
          events.push({
            type: "quick_reply",
            senderId,
            payload: msg.quick_reply.payload,
            mid,
            timestamp,
          });
          continue;
        }

        // Image attachment
        if (msg.attachments?.length) {
          const imageAttachment = msg.attachments.find(
            (a: any) => a.type === "image",
          );
          if (imageAttachment?.payload?.url) {
            events.push({
              type: "image",
              senderId,
              url: imageAttachment.payload.url,
              mid,
              ...(ref ? { ref } : {}),
              timestamp,
            });
            continue;
          }
        }

        // Text message (default)
        if (msg.text) {
          events.push({
            type: "message",
            senderId,
            text: msg.text,
            mid,
            ...(ref ? { ref } : {}),
            timestamp,
          });
          continue;
        }
      }
    }
  }

  return events;
}
