/**
 * ManyChat Integration — receives messages from ManyChat,
 * processes them through our bot logic, returns responses.
 *
 * ManyChat sends: POST /api/manychat/webhook
 * We respond with: { text: "response" } or ManyChat dynamic content
 *
 * Also provides: POST /api/manychat/send — for our backend to trigger
 * messages through ManyChat's API
 */
import { Router } from "express";
import { prisma } from "../lib/db.js";

export const manychatRouter = Router();

const MANYCHAT_API_KEY = process.env.MANYCHAT_API_KEY || "";

function signupGreeting(name: string): string {
  const greetings = [
    `yoo ${name}!! u made it, welcome to ditto 🤝`,
    `ayyy ${name} what's good, you're locked in 🔥`,
    `yooo ${name}! glad u signed up, let's get this going 💪`,
    `${name}!! let's gooo you're officially in 🎉`,
    `ayy welcome ${name}, u already know what it is 😤🔥`,
    `yoo ${name} u just made it in, dubs only from here 🤞`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
const MANYCHAT_API = "https://api.manychat.com/fb";

// ── Incoming message webhook from ManyChat ──
// ManyChat "External Request" action sends user data + message here
manychatRouter.post("/webhook", async (req, res) => {
  try {
    const {
      ig_id,           // Instagram scoped ID
      ig_username,     // Instagram username
      first_name,      // User's first name from IG
      last_name,       // User's last name from IG
      message,         // The message text
      custom_fields,   // Any custom fields set in ManyChat
    } = req.body;

    console.log(`[ManyChat] Message from @${ig_username} (${ig_id}): "${message}"`);

    // Look up user in our DB
    const user = ig_id ? await prisma.bublProfile.findFirst({
      where: { ig_id: String(ig_id) },
    }).catch(() => null) : null;

    // Look up team
    let team = null;
    if (user) {
      team = await prisma.blindDateTeam.findFirst({
        where: {
          OR: [
            { player1_ig_id: String(ig_id) },
            { player2_ig_id: String(ig_id) },
          ],
        },
        orderBy: { created_at: "desc" },
      }).catch(() => null);
    }

    // Save message to history
    if (ig_id) {
      await prisma.bublChatHistory.create({
        data: {
          phone: String(ig_id),
          ig_id: String(ig_id),
          role: "user",
          content: message || "",
        },
      }).catch(() => {});
    }

    const SITE_URL = process.env.SITE_URL || "ara-malarial-poisedly.ngrok-free.dev";
    const name = first_name || ig_username || "yo";

    // ── Route the message ──
    let response: string[];

    // User already has a team
    if (user && team) {
      const partyLink = `${SITE_URL}/party/${team.code}`;
      response = [`${name} u already in`, `ur lobby: ${partyLink}`];
    }
    // User exists but no team — try auto-match
    else if (user && !team) {
      const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await prisma.blindDateTeam.create({
        data: {
          code: teamCode,
          player1_name: user.name,
          player1_phone: String(ig_id),
          player1_gender: user.gender || "unknown",
          player1_ig_id: String(ig_id),
          player1_ready: true,
          status: "waiting",
        },
      }).catch(() => {});
      const partyLink = `${SITE_URL}/party/${teamCode}`;
      response = [
        signupGreeting(name),
        `send this to ur duo so they can sign up: ${process.env.SITE_URL || "ara-malarial-poisedly.ngrok-free.dev"}/signup?duo=${teamCode}`,
        `ur lobby: ${partyLink}`,
      ];
    }
    // Try auto-match with pending signup
    else {
      const pending = await prisma.bublProfile.findFirst({
        where: { phone: { startsWith: "signup_" }, ig_id: null },
        orderBy: { created_at: "desc" },
      }).catch(() => null);

      if (pending && (Date.now() - pending.created_at.getTime()) < 30 * 60 * 1000) {
        // Auto-match
        const originalPhone = pending.phone;
        await prisma.bublProfile.update({
          where: { id: pending.id },
          data: { phone: String(ig_id), ig_id: String(ig_id) },
        });

        // Check if User B (already on team)
        const existingTeam = await prisma.blindDateTeam.findFirst({
          where: { player2_phone: originalPhone },
          orderBy: { created_at: "desc" },
        }).catch(() => null);

        if (existingTeam) {
          await prisma.blindDateTeam.update({
            where: { id: existingTeam.id },
            data: { player2_ig_id: String(ig_id), player2_ready: true },
          });
          const inviterName = existingTeam.player1_name.split(" ")[0];
          const partyLink = `${SITE_URL}/party/${existingTeam.code}`;
          response = [
            `${pending.name.split(" ")[0]} u n ${inviterName} are locked in`,
            `ur lobby: ${partyLink}`,
          ];
          // Notify User A via ManyChat
          if (existingTeam.player1_ig_id && MANYCHAT_API_KEY) {
            sendViaManyChat(existingTeam.player1_ig_id,
              `yo ${pending.name.split(" ")[0]} just joined ur duo ${partyLink}`
            ).catch(() => {});
          }
        } else {
          // User A — create team
          const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          await prisma.blindDateTeam.create({
            data: {
              code: teamCode,
              player1_name: pending.name,
              player1_phone: String(ig_id),
              player1_gender: pending.gender || "unknown",
              player1_ig_id: String(ig_id),
              player1_ready: true,
              status: "waiting",
            },
          }).catch(() => {});
          const partyLink = `${SITE_URL}/party/${teamCode}`;
          response = [
            signupGreeting(pending.name.split(" ")[0]),
            `send this to ur duo so they can sign up: ${process.env.SITE_URL || "ara-malarial-poisedly.ngrok-free.dev"}/signup?duo=${teamCode}`,
            `ur lobby: ${partyLink}`,
          ];
        }
      } else {
        // No match — send welcome
        response = [
          `yoo welcome to doubles`,
          `wanna get in? sign up here: ${SITE_URL}/signup`,
        ];
      }
    }

    // Save bot response to history
    if (ig_id) {
      await prisma.bublChatHistory.create({
        data: {
          phone: String(ig_id),
          ig_id: String(ig_id),
          role: "assistant",
          content: response.join("\n"),
        },
      }).catch(() => {});
    }

    // Return response for ManyChat to send via response mapping
    return res.json({
      ok: true,
      messages: response.map(text => ({ type: "text", text })),
    });
  } catch (e) {
    console.error("[ManyChat] Webhook error:", e);
    return res.status(500).json({ ok: false, error: "internal error" });
  }
});

// ── Send message via ManyChat API ──
async function sendViaManyChat(subscriberId: string, text: string): Promise<void> {
  if (!MANYCHAT_API_KEY) return;

  try {
    const res = await fetch(`${MANYCHAT_API}/sending/sendContent`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        data: {
          version: "v2",
          content: {
            messages: [{ type: "text", text }],
          },
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[ManyChat] Send failed:", errText);

      // Try alternative endpoint format
      const res2 = await fetch(`${MANYCHAT_API}/sending/sendFlow`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          flow_ns: "content",
          data: { text },
        }),
      });
      if (!res2.ok) {
        console.error("[ManyChat] Alt send also failed:", await res2.text());
      }
    } else {
      console.log(`[ManyChat] Sent to ${subscriberId}: "${text.slice(0, 60)}"`);
    }
  } catch (e: any) {
    console.error("[ManyChat] Send error:", e.message);
  }
}

// Export for use in other files
export { sendViaManyChat };
