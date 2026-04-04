/**
 * Instagram DM Poller — fallback for when webhooks don't fire.
 * Polls the Facebook Conversations API every few seconds for new messages.
 * Uses graph.facebook.com (not graph.instagram.com) for conversations endpoint.
 */

const FB_API = "https://graph.facebook.com/v21.0";
const POLL_INTERVAL = 2000; // 2 seconds
const processedMids = new Set<string>();
let firstPollDone = false;

const SELF_IDS = new Set([
  process.env.INSTAGRAM_ACCOUNT_ID || "",
  process.env.FACEBOOK_PAGE_ID || "1074853689041578",
  "17841480167268037",
  "1074853689041578",
]);

interface Message {
  id: string;
  message?: string;
  from: { username: string; id: string };
  created_time: string;
}

interface Conversation {
  id: string;
  messages?: { data: Message[] };
}

export function startPoller(
  igAccountId: string,
  onMessage: (senderId: string, text: string, ref?: string) => Promise<void>,
) {
  console.log(`[IG Poller] Starting poll every ${POLL_INTERVAL / 1000}s`);

  async function poll() {
    try {
      const token = process.env.META_PAGE_ACCESS_TOKEN!;
      const pageId = process.env.FACEBOOK_PAGE_ID || "1074853689041578";
      const url = `${FB_API}/${pageId}/conversations?fields=messages.limit(3)%7Bmessage,from,created_time%7D&platform=instagram&access_token=${token}`;
      const res = await fetch(url);
      const raw = await res.text();
      let data: { data?: Conversation[]; error?: { message: string } };
      try { data = JSON.parse(raw); } catch { console.error(`[IG Poller] Bad JSON: ${raw.slice(0, 200)}`); return; }

      if (data.error) {
        console.error(`[IG Poller] API error: ${data.error.message}`);
        return;
      }

      const totalMsgs = (data.data ?? []).reduce((n, c) => n + (c.messages?.data?.length ?? 0), 0);
      if (!firstPollDone) console.log(`[IG Poller] First poll: ${data.data?.length ?? 0} convos, ${totalMsgs} msgs`);

      for (const convo of data.data ?? []) {
        for (const msg of convo.messages?.data ?? []) {
          // Skip messages we've already processed
          if (processedMids.has(msg.id)) continue;
          processedMids.add(msg.id);

          // Skip on first poll (just seed the cache)
          if (!firstPollDone) continue;

          // Skip messages from ourselves (the bot)
          if (SELF_IDS.has(msg.from.id)) continue;

          const text = msg.message ?? "";
          if (!text) continue;

          console.log(`[IG Poller] New message from ${msg.from.username} (${msg.from.id}): "${text.slice(0, 80)}"`);
          onMessage(msg.from.id, text).catch((e) =>
            console.error(`[IG Poller] Error handling message:`, e),
          );
        }
      }

      // Keep processedMids from growing forever
      if (processedMids.size > 1000) {
        const arr = [...processedMids];
        arr.splice(0, arr.length - 500);
        processedMids.clear();
        arr.forEach((id) => processedMids.add(id));
      }
    } catch (e) {
      console.error(`[IG Poller] Error:`, e instanceof Error ? e.message : e);
    }
  }

  // First poll seeds the processedMids so we don't replay old messages
  poll().then(() => {
    firstPollDone = true;
    console.log(`[IG Poller] Seeded ${processedMids.size} existing messages, now listening for new ones`);
    setInterval(poll, POLL_INTERVAL);
  });
}
