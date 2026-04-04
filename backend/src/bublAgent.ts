import OpenAI from "openai";
import { prisma } from "./lib/db.js";
import {
  sendText,
  sendTypingOn,
  sendTypingOff,
  sendMarkSeen,
  sendQuickReplies,
  getUserProfile,
} from "./lib/instagram/instagramClient.js";
import {
  recordUserMessage,
  isWindowOpen,
  getQueuedMessages,
} from "./lib/instagram/windowTracker.js";

// In-memory cache backed by DB
const historyCache = new Map<string, { role: "user" | "assistant"; content: string }[]>();

// Debounce — wait for user to stop typing before replying (catches multi-message bursts)
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingMessages = new Map<string, { texts: string[]; ref?: string }>();

const REPLY_DELAY = 800;
const recentInbound = new Set<string>();
const MAX_HISTORY = 30;

// ─── Persistent history ───

async function loadHistory(igId: string): Promise<{ role: "user" | "assistant"; content: string }[]> {
  if (historyCache.has(igId)) return historyCache.get(igId)!;
  try {
    const rows = await prisma.bublChatHistory.findMany({
      where: { phone: igId },
      orderBy: { created_at: "asc" },
      take: MAX_HISTORY,
    });
    const history = rows.map(r => ({ role: r.role as "user" | "assistant", content: r.content }));
    historyCache.set(igId, history);
    return history;
  } catch { return []; }
}

async function saveMessage(igId: string, role: "user" | "assistant", content: string) {
  try {
    await prisma.bublChatHistory.create({ data: { phone: igId, role, content } });
    const history = historyCache.get(igId) || [];
    history.push({ role, content });
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    historyCache.set(igId, history);
    const count = await prisma.bublChatHistory.count({ where: { phone: igId } });
    if (count > 80) {
      const oldest = await prisma.bublChatHistory.findMany({
        where: { phone: igId },
        orderBy: { created_at: "asc" },
        take: count - 80,
        select: { id: true },
      });
      await prisma.bublChatHistory.deleteMany({ where: { id: { in: oldest.map(r => r.id) } } });
    }
  } catch {}
}

export async function clearHistory(igId: string) {
  historyCache.delete(igId);
  try {
    await prisma.bublChatHistory.deleteMany({ where: { phone: igId } });
  } catch {}
}

// ─── LLM client ───

function getLLM(): OpenAI {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return new OpenAI({ apiKey: openaiKey });
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    return new OpenAI({
      apiKey: geminiKey,
      baseURL: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }
  throw new Error("No LLM API key (OPENAI_API_KEY or GEMINI_API_KEY)");
}

function getModel(): string {
  if (process.env.OPENAI_API_KEY) return "gpt-4o-mini";
  return "gemini-2.0-flash";
}

// ─── Helpers ───

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function typingDelay(text: string): number {
  const words = text.split(/\s+/).length;
  const base = Math.min(words * 300, 4000);
  const variance = Math.random() * 800 - 400;
  return Math.max(800, base + variance);
}

// ─── DB lookups ───

async function lookupUserByIg(igId: string) {
  try {
    return await prisma.bublProfile.findFirst({ where: { ig_id: igId } });
  } catch { return null; }
}

async function lookupTeamByRef(ref: string) {
  try {
    return await prisma.blindDateTeam.findFirst({ where: { code: ref } });
  } catch { return null; }
}

async function lookupTeam(igId: string) {
  try {
    return await prisma.blindDateTeam.findFirst({
      where: { OR: [{ player1_ig_id: igId }, { player2_ig_id: igId }] },
      orderBy: { created_at: "desc" },
    });
  } catch { return null; }
}

async function markReady(igId: string) {
  try {
    const team = await lookupTeam(igId);
    if (!team) return null;
    const isP1 = team.player1_ig_id === igId;
    return await prisma.blindDateTeam.update({
      where: { id: team.id },
      data: isP1 ? { player1_ready: true } : { player2_ready: true },
    });
  } catch { return null; }
}

async function logActivity(action: string, name?: string, igId?: string, details?: string) {
  try {
    await prisma.adminActivityLog.create({
      data: { action, actor_name: name || undefined, actor_phone: igId || undefined, details: details || undefined },
    });
  } catch {}
}

// ─── System prompt ───

function buildSystemPrompt(
  user: { name: string; gender?: string | null } | null,
  team: { code: string; status: string; player1_name: string; player2_name: string | null; player1_ready: boolean; player2_ready: boolean } | null,
  igName?: string | null,
  igUsername?: string | null,
): string {
  const firstName = user?.name?.split(" ")[0] || igName || "there";
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

  let context = "";
  if (user) {
    context += `\nUser: ${user.name} (${firstName}). Gender: ${user.gender || "unknown"}. Signed up.`;
  }
  if (team) {
    const isP1 = team.player1_name === user?.name;
    const teammateName = isP1 ? team.player2_name : team.player1_name;
    const ready = isP1 ? team.player1_ready : team.player2_ready;
    context += `\nTeam: ${team.code} (${team.status}).`;
    if (teammateName) context += ` Teammate: ${teammateName}.`;
    else context += ` No teammate yet.`;
    context += ` ${firstName} is ${ready ? "ready" : "not ready yet"}.`;
  }
  if (!user) {
    context += `\nNot signed up yet.`;
    if (igName) context += ` Their Instagram display name is "${igName}".`;
    if (igUsername) context += ` Their Instagram username is @${igUsername}.`;
    context += ` Sign up at ara-malarial-poisedly.ngrok-free.dev`;
  }

  const SIGNUP_LINK = "ara-malarial-poisedly.ngrok-free.dev/signup";

  return `You are Ditto — you set up double dates through Instagram DMs. You pair two duos together every Wednesday at UCR.

YOUR PERSONALITY:
- You're a real person, not a bot. Witty, warm, a little unhinged in a fun way
- lowercase always. short punchy texts. like texting ur friend
- Use slang naturally — "fr", "ngl", "lowkey", "tho", "bet", "no cap" — but don't overdo it
- Match their energy exactly. Chill = chill. Hype = hype. Unhinged = play along
- Emojis sparingly — max 1 per message, skip most of the time
- NEVER say you're AI/a bot. You ARE Ditto. If asked, deflect — "bro i literally just set up dates lol"
- You CAN see their Instagram name and username (it's in the context below). Use it naturally if they ask
- If they say something random/off-topic, play along for a beat then redirect back

RESPONSE FORMAT:
- Reply in EXACTLY 2 SHORT messages (split with |||)
- First message: react to what they said, match their vibe, answer their question
- Second message: redirect to signup link if not signed up, or next action if signed up
- Example: "ngl that's actually a solid question|||sign up with a friend and i'll match your duo every wednesday — lock in: ${SIGNUP_LINK}"
- ALWAYS include ${SIGNUP_LINK} in the second message if they haven't signed up
- Each message = 1-2 sentences MAX. Rapid-fire DMs, not paragraphs
- NEVER send 3 messages. Always exactly 2.

HOW x2/DITTO WORKS:
- You and a friend sign up as a duo at ${SIGNUP_LINK}
- Every Wednesday, Ditto matches your duo with another duo
- 2v2 double date — less awkward, more fun
- All through Instagram DMs. No app
- Currently at UCR, expanding campus by campus

RIGHT NOW: ${dayOfWeek} ${timeOfDay}
${context}

IMPORTANT RULES:
- If not signed up, EVERY reply must include ${SIGNUP_LINK}
- Answer their question FIRST, then redirect. Don't dodge
- Don't repeat the same phrasing from previous messages — switch it up
- Keep it light. Never lecture. Never be preachy
- Late night = shorter, chiller. Daytime = more energy`;
}

// ─── Generate reply via LLM ───

async function generateReply(
  senderId: string,
  combinedText: string,
  user: Awaited<ReturnType<typeof lookupUserByIg>>,
  team: Awaited<ReturnType<typeof lookupTeam>>,
  igName?: string | null,
  igUsername?: string | null,
): Promise<string[]> {
  const history = await loadHistory(senderId);

  await saveMessage(senderId, "user", combinedText);

  const systemPrompt = buildSystemPrompt(user, team, igName, igUsername);

  try {
    const llm = getLLM();
    const response = await llm.chat.completions.create({
      model: getModel(),
      max_tokens: 200,
      temperature: 0.75,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });

    let reply = response.choices[0]?.message?.content?.trim() || "one sec something glitched on my end";

    // Clean up LLM artifacts
    if (reply.startsWith('"') && reply.endsWith('"')) reply = reply.slice(1, -1);

    // Split on ||| delimiter into separate messages — ONLY use |||, never newlines
    let messages = reply.split("|||").map(m => m.replace(/\n/g, " ").trim()).filter(m => m.length > 0);

    // Strict cap at 2 messages
    if (messages.length > 2) messages = messages.slice(0, 2);

    await saveMessage(senderId, "assistant", messages.join("\n"));

    return messages;
  } catch (e) {
    console.error("[ditto] LLM error:", e);
    const firstName = user?.name?.split(" ")[0] || "";
    return [firstName ? `${firstName} gimme one sec something's being weird` : "gimme one sec something's being weird"];
  }
}

// ─── Send a batch of reply messages to Instagram ───

async function sendReplies(senderId: string, replies: string[]) {
  for (let i = 0; i < replies.length; i++) {
    const text = replies[i];

    await sleep(typingDelay(text));

    try {
      await sendText(senderId, text);
    } catch (e) {
      console.error(`[ditto] Failed to send message to ${senderId}:`, e);
      break;
    }
    console.log(`[ditto] -> ${senderId} [${i + 1}/${replies.length}]: "${text}"`);

    // Brief pause between multi-messages
    if (i < replies.length - 1) {
      await sendTypingOff(senderId).catch(() => {});
      await sleep(300 + Math.random() * 500);
      await sendTypingOn(senderId).catch(() => {});
    }
  }

  await sendTypingOff(senderId).catch(() => {});
}

// ─── Process queued messages (fires after debounce) ───

async function processMessages(senderId: string) {
  const pending = pendingMessages.get(senderId);
  if (!pending || pending.texts.length === 0) return;

  const { texts, ref } = pending;
  pendingMessages.delete(senderId);
  pendingTimers.delete(senderId);

  const combinedText = texts.length === 1
    ? texts[0]
    : texts.map((t, i) => `(${i + 1}) ${t}`).join("\n");

  console.log(`[ditto] Processing ${texts.length} msg(s) from ${senderId}: "${combinedText}"`);

  // Mark seen + start typing
  await sendMarkSeen(senderId).catch((e) => console.warn("[ditto] mark_seen failed:", e instanceof Error ? e.message : e));
  await sleep(500 + Math.random() * 1000);
  await sendTypingOn(senderId).catch(() => {});

  // Flush any queued messages from when the window was closed
  const queued = await getQueuedMessages(senderId);
  if (queued.length > 0) {
    console.log(`[ditto] Flushing ${queued.length} queued message(s) for ${senderId}`);
    await sendReplies(senderId, queued);
  }

  // Look up user context + IG profile
  const user = await lookupUserByIg(senderId);
  const team = user ? await lookupTeam(senderId) : null;
  let firstName = user?.name?.split(" ")[0] || null;

  // Always grab IG profile for name + username
  let igUsername: string | null = null;
  try {
    const igProfile = await getUserProfile(senderId);
    if (igProfile.name && !firstName) firstName = igProfile.name.split(" ")[0];
    if (igProfile.username) igUsername = igProfile.username;
    console.log(`[ditto] IG profile for ${senderId}: name=${igProfile.name}, username=${igProfile.username}`);
  } catch (e) {
    console.warn("[ditto] Could not fetch IG profile:", e instanceof Error ? e.message : e);
  }

  // ── Signup ref flow: user came from the form with a signup code in the ref ──
  if (ref && ref.startsWith("signup_")) {
    const code = ref.replace("signup_", "");
    try {
      const pending = await prisma.bublProfile.findFirst({
        where: { phone: `signup_${code}` },
      });
      if (pending) {
        await prisma.bublProfile.update({
          where: { id: pending.id },
          data: { phone: senderId, ig_id: senderId },
        });
        const signupName = pending.name.split(" ")[0];
        const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
          await prisma.blindDateTeam.create({
            data: {
              code: teamCode,
              player1_name: pending.name,
              player1_phone: senderId,
              player1_gender: pending.gender || "unknown",
              player1_ig_id: senderId,
              player1_ready: true,
              status: "waiting",
            },
          });
        } catch { /* */ }
        const inviteLink = `ara-malarial-poisedly.ngrok-free.dev/party/${teamCode}`;
        const replies = [
          `${signupName} you're locked in 🔥`,
          `forward this to your friend so they can join your duo: ${inviteLink}`,
        ];
        await sendReplies(senderId, replies);
        await saveMessage(senderId, "user", combinedText || "signed up via ref");
        await saveMessage(senderId, "assistant", replies.join("\n"));
        logActivity("signup_complete_ref", signupName, senderId, `code=${code}, team=${teamCode}`);
        return;
      }
    } catch (e) {
      console.warn("[ditto] Signup ref lookup failed:", e instanceof Error ? e.message : e);
    }
  }

  // ── Ref link flow: new user coming from a duo invite ──
  if (ref && !user) {
    const refTeam = await lookupTeamByRef(ref);
    const inviterName = refTeam?.player1_name?.split(" ")[0] || "your friend";
    const signupLink = `ara-malarial-poisedly.ngrok-free.dev/signup?duo=${ref}`;
    const replies = [
      `yooo ${inviterName} invited you to be their duo partner`,
      `sign up here and you two are locked in for this week's match`,
      signupLink,
    ];
    await sendReplies(senderId, replies);
    await saveMessage(senderId, "user", combinedText);
    await saveMessage(senderId, "assistant", replies.join("\n"));
    logActivity("ref_invite", undefined, senderId, `ref=${ref}`);
    return;
  }

  // ── Signup code flow: user sends their code from the form ──
  const codeMatch = combinedText.match(/\b([A-Z0-9]{6})\b/);
  if (codeMatch) {
    const code = codeMatch[1];
    try {
      const pending = await prisma.bublProfile.findFirst({
        where: { phone: `signup_${code}` },
      });
      if (pending) {
        // Link profile to this IG user
        await prisma.bublProfile.update({
          where: { id: pending.id },
          data: {
            phone: senderId, // use IG ID as identifier
            ig_id: senderId,
          },
        });

        const signupName = pending.name.split(" ")[0];
        const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create a team for them
        try {
          await prisma.blindDateTeam.create({
            data: {
              code: teamCode,
              player1_name: pending.name,
              player1_phone: senderId,
              player1_gender: pending.gender || "unknown",
              player1_ig_id: senderId,
              player1_ready: true,
              status: "waiting",
            },
          });
        } catch { /* table might not exist yet */ }

        const inviteLink = `ara-malarial-poisedly.ngrok-free.dev/party/${teamCode}`;
        const replies = [
          `${signupName} you're locked in 🔥`,
          `now forward this to your friend so they can join your duo: ${inviteLink}`,
        ];
        await sendReplies(senderId, replies);
        await saveMessage(senderId, "user", combinedText);
        await saveMessage(senderId, "assistant", replies.join("\n"));
        logActivity("signup_complete", signupName, senderId, `code=${code}, team=${teamCode}`);
        return;
      }
    } catch (e) {
      console.warn("[ditto] Signup code lookup failed:", e instanceof Error ? e.message : e);
    }
  }

  // ── "I'm done" / "I signed up" flow — ask for code ──
  const lower = combinedText.toLowerCase();
  const isDoneMsg = lower.includes("done") || lower.includes("signed up") || lower.includes("finished") || lower.includes("completed") || lower.includes("filled") || lower.includes("form");
  if (isDoneMsg && !user) {
    const replies = [
      `${firstName || "yo"} nice! send me the 6-letter code from the signup page and i'll lock you in`,
    ];
    await sendReplies(senderId, replies);
    await saveMessage(senderId, "user", combinedText);
    await saveMessage(senderId, "assistant", replies.join("\n"));
    return;
  }

  // ── Activation flow: user says they signed up (already registered) ──
  const isActivation = (lower.includes("signed up") || lower.includes("i've signed up")) && user;
  if (isActivation) {
    await markReady(senderId);
    logActivity("ready_up", firstName || undefined, senderId, `Team: ${team?.code || "none"}`);

    const name = firstName || "yo";
    const lobbyLink = team ? `ara-malarial-poisedly.ngrok-free.dev/lobby/${team.code}` : "ara-malarial-poisedly.ngrok-free.dev";
    const replies = [
      `${name} lets go you're locked in`,
      `now get your duo partner to sign up too so you're matched this wednesday`,
      lobbyLink,
    ];
    await sendReplies(senderId, replies);
    await saveMessage(senderId, "user", combinedText);
    await saveMessage(senderId, "assistant", replies.join("\n"));
    logActivity("activation", firstName || undefined, senderId, "Signup activation + duo invite pitch");
    return;
  }

  // ── Default: LLM reply ──
  const replies = await generateReply(senderId, combinedText, user, team, firstName, igUsername);

  logActivity("message", firstName || undefined, senderId, `"${combinedText}" -> "${replies.join(" | ")}"`);

  await sendReplies(senderId, replies);
}

// ─── Public entry point — called by the webhook route ───

export async function handleInstagramMessage(senderId: string, text: string, ref?: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  // Ignore messages from ourselves
  const selfIds = new Set([
    process.env.INSTAGRAM_ACCOUNT_ID || "",
    process.env.FACEBOOK_PAGE_ID || "1074853689041578",
    "17841480167268037",
    "1074853689041578",
  ]);
  if (selfIds.has(senderId)) return;

  // Deduplicate — same sender + same text within 10s = skip
  const dedupeKey = `${senderId}:${trimmed}`;
  if (recentInbound.has(dedupeKey)) return;
  recentInbound.add(dedupeKey);
  setTimeout(() => recentInbound.delete(dedupeKey), 10_000);

  console.log(`[ditto] <- ${senderId}: "${trimmed}"`);

  // Record inbound message for 24-hour window tracking
  await recordUserMessage(senderId);

  // Queue this message — debounce catches multi-message bursts
  if (!pendingMessages.has(senderId)) {
    pendingMessages.set(senderId, { texts: [], ref });
  }
  const pending = pendingMessages.get(senderId)!;
  pending.texts.push(trimmed);
  if (ref) pending.ref = ref;

  // Reset debounce timer
  const existing = pendingTimers.get(senderId);
  if (existing) clearTimeout(existing);

  pendingTimers.set(senderId, setTimeout(() => {
    processMessages(senderId).catch(e => console.error("[ditto] Process error:", e));
  }, REPLY_DELAY));
}

// ─── Agent startup ───

export async function startBublAgent() {
  console.log("[ditto] Instagram DM agent ready");

  // Start polling as fallback for webhooks
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  if (igAccountId && process.env.META_PAGE_ACCESS_TOKEN) {
    const { startPoller } = await import("./lib/instagram/poller.js");
    startPoller(igAccountId, handleInstagramMessage);
  } else {
    console.warn("[ditto] Missing INSTAGRAM_ACCOUNT_ID or META_PAGE_ACCESS_TOKEN — polling disabled");
  }
}
