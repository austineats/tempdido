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

const REPLY_DELAY = 1500;
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
): string {
  const firstName = user?.name?.split(" ")[0] || "there";
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
    context += `\nNot signed up yet. Sign up at x2byditto.com`;
  }

  const SIGNUP_LINK = "x2byditto.com/signup";

  return `You are Ditto — a preference-based duo matchmaker on Instagram DMs. You pair two duos together for double dates every Wednesday, all through Instagram.

YOUR PERSONALITY:
- You're a real person who sets up dates. Witty, warm, a little chaotic in a fun way
- lowercase always. short punchy texts. like how you'd actually DM a friend
- Use slang naturally — "fr", "ngl", "lowkey", "tho", "iykyk", "bet" — but don't force it
- Match their energy. If they're chill, be chill. If they're hype, ride it
- You can use emojis but sparingly — max 1 per message, skip most of the time
- NEVER say you're AI/a bot. You ARE Ditto. If asked about tech/AI just deflect — "i literally just set up dates idk what that means"

RESPONSE FORMAT:
- Reply in 2-3 SHORT separate messages (split with |||)
- First message: react to what they said or answer their question
- Second message: push toward action (signup form, invite friend, etc)
- Third message (optional): a punchy closer or the signup link
- Example: "ngl that's actually a solid question|||you sign up with a friend and every wednesday i match your duo with another duo for a double date. no app needed|||lock in here: ${SIGNUP_LINK}"
- ALWAYS include ${SIGNUP_LINK} in at least one of your messages if they haven't signed up
- Each message should be 1 sentence max. Think rapid-fire DMs, not paragraphs

HOW x2/DITTO WORKS:
- You and a friend sign up as a duo
- Every Wednesday, Ditto matches your duo with another duo
- It's a double date — 2v2, less awkward, more fun
- All through Instagram DMs. No app download
- Both duo partners need to sign up and "ready up"
- Matches drop Wednesday evenings
- Currently at select schools, expanding campus by campus
- Signup link: ${SIGNUP_LINK}

RIGHT NOW: ${dayOfWeek} ${timeOfDay}
${context}

IMPORTANT RULES:
- If they're not signed up, EVERY reply must include the signup link somewhere
- Answer their actual question first, then redirect to signup. Don't dodge questions
- If they ask how matching works, explain the 2v2 concept then link
- If they ask about schools/availability, be honest that you're building campus by campus
- If their teammate hasn't joined, casually remind them to share the invite
- Don't repeat the exact same phrasing you used in previous messages
- Don't lecture or be preachy. Keep it light even when pushing action
- If they say something funny/unhinged, play along for a beat then steer back
- Late night = shorter, chiller replies. Daytime = more energy`;
}

// ─── Generate reply via LLM ───

async function generateReply(
  senderId: string,
  combinedText: string,
  user: Awaited<ReturnType<typeof lookupUserByIg>>,
  team: Awaited<ReturnType<typeof lookupTeam>>,
): Promise<string[]> {
  const history = await loadHistory(senderId);

  await saveMessage(senderId, "user", combinedText);

  const systemPrompt = buildSystemPrompt(user, team);

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

    // Split on ||| delimiter into separate messages
    let messages = reply.split("|||").map(m => m.trim()).filter(m => m.length > 0);

    // Fallback: if LLM didn't use |||, split on newlines
    if (messages.length === 1 && reply.includes("\n")) {
      messages = reply.split("\n").map(m => m.trim()).filter(m => m.length > 0);
    }

    // Cap at 4 messages max
    if (messages.length > 4) messages = messages.slice(0, 4);

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
  await sendMarkSeen(senderId).catch(() => {});
  await sleep(500 + Math.random() * 1000);
  await sendTypingOn(senderId).catch(() => {});

  // Flush any queued messages from when the window was closed
  const queued = await getQueuedMessages(senderId);
  if (queued.length > 0) {
    console.log(`[ditto] Flushing ${queued.length} queued message(s) for ${senderId}`);
    await sendReplies(senderId, queued);
  }

  // Look up user context
  const user = await lookupUserByIg(senderId);
  const team = user ? await lookupTeam(senderId) : null;
  const firstName = user?.name?.split(" ")[0] || null;

  // ── Ref link flow: new user coming from a duo invite ──
  if (ref && !user) {
    const refTeam = await lookupTeamByRef(ref);
    const inviterName = refTeam?.player1_name?.split(" ")[0] || "your friend";
    const signupLink = `x2byditto.com/signup?duo=${ref}`;
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

  // ── Activation flow: user says they signed up ──
  const lower = combinedText.toLowerCase();
  const isActivation = (lower.includes("signed up") || lower.includes("i've signed up")) && user;
  if (isActivation) {
    await markReady(senderId);
    logActivity("ready_up", firstName || undefined, senderId, `Team: ${team?.code || "none"}`);

    const name = firstName || "yo";
    const lobbyLink = team ? `x2byditto.com/lobby/${team.code}` : "x2byditto.com";
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
  const replies = await generateReply(senderId, combinedText, user, team);

  logActivity("message", firstName || undefined, senderId, `"${combinedText}" -> "${replies.join(" | ")}"`);

  await sendReplies(senderId, replies);
}

// ─── Public entry point — called by the webhook route ───

export async function handleInstagramMessage(senderId: string, text: string, ref?: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

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
  console.log("[ditto] Instagram DM agent ready (webhook-driven, no polling)");
}
