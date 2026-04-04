import * as postmark from "postmark";

const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN || "");
const FROM = process.env.FROM_EMAIL || "team@dittt.ai";

// ── Send welcome email (signup) ──
export async function sendWelcomeEmail(to: string, name: string) {
  try {
    await client.sendEmail({
      From: FROM,
      To: to,
      Subject: "welcome to doubles by ditto 🎯",
      HtmlBody: `
        <div style="font-family: monospace; background: #111827; color: #E8DEF8; padding: 40px; text-align: center;">
          <h1 style="color: #ec4899; font-size: 32px; font-family: system-ui;">doubles</h1>
          <p style="color: #A5B4C8; font-size: 12px;">by Ditto</p>
          <hr style="border: 1px solid #6366f1; margin: 24px 0;" />
          <p style="font-size: 16px;">hey ${name}! 👋</p>
          <p style="color: #A5B4C8;">you're signed up for doubles — the 2v2 blind date matchmaker.</p>
          <p style="color: #A5B4C8;">DM <strong style="color: #ec4899;">@ditto.test</strong> on Instagram to finish setting up.</p>
          <p style="color: #A5B4C8; margin-top: 24px; font-size: 12px;">match day is every wednesday 🎯</p>
        </div>
      `,
      TextBody: `hey ${name}! you're signed up for doubles by ditto. DM @ditto.test on Instagram to finish setting up. match day is every wednesday.`,
      MessageStream: "email-verification",
    });
    console.log(`[email] Welcome sent to ${to}`);
  } catch (e) {
    console.error("[email] Failed to send welcome:", e instanceof Error ? e.message : e);
  }
}
