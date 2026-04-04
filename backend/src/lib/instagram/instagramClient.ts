/**
 * Instagram Graph API client for sending/receiving DMs.
 * Uses native fetch (Node 18+). No external HTTP libraries.
 */

const API_BASE = "https://graph.facebook.com/v21.0";

function getAccessToken(): string {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  return token;
}

function getAccountId(): string {
  const id = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!id) throw new Error("INSTAGRAM_ACCOUNT_ID is not set");
  return id;
}

// ── Rate-limit tracking ──────────────────────────────────────────────

let rateLimitRemaining: number | null = null;
let rateLimitReset: number | null = null; // epoch seconds

export function getRateLimitInfo() {
  return { remaining: rateLimitRemaining, resetAt: rateLimitReset };
}

// ── Core API helper ──────────────────────────────────────────────────

export async function callApi(
  path: string,
  method: string,
  body?: object,
): Promise<unknown> {
  const url = `${API_BASE}${path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Track rate-limit headers when present
  const rlRemaining = res.headers.get("x-app-usage");
  if (rlRemaining) {
    try {
      const usage = JSON.parse(rlRemaining);
      rateLimitRemaining = 100 - (usage.call_count ?? 0);
    } catch {
      // ignore malformed header
    }
  }
  const rlReset = res.headers.get("x-business-use-case-usage");
  if (rlReset) {
    try {
      const usage = JSON.parse(rlReset);
      const accountId = getAccountId();
      const entry = usage[accountId]?.[0];
      if (entry?.estimated_time_to_regain_access) {
        rateLimitReset = Math.floor(Date.now() / 1000) + entry.estimated_time_to_regain_access * 60;
      }
    } catch {
      // ignore malformed header
    }
  }

  const data = await res.json();

  if (!res.ok) {
    const errMsg =
      (data as any)?.error?.message ?? JSON.stringify(data);
    throw new Error(
      `Instagram API ${method} ${path} failed (${res.status}): ${errMsg}`,
    );
  }

  return data;
}

// ── Messaging ────────────────────────────────────────────────────────

export async function sendText(
  recipientId: string,
  text: string,
): Promise<unknown> {
  return callApi("/me/messages", "POST", {
    recipient: { id: recipientId },
    message: { text },
  });
}

export async function sendImage(
  recipientId: string,
  imageUrl: string,
): Promise<unknown> {
  return callApi("/me/messages", "POST", {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "image",
        payload: { url: imageUrl },
      },
    },
  });
}

export async function sendQuickReplies(
  recipientId: string,
  text: string,
  replies: { title: string; payload: string }[],
): Promise<unknown> {
  return callApi("/me/messages", "POST", {
    recipient: { id: recipientId },
    message: {
      text,
      quick_replies: replies.map((r) => ({
        content_type: "text",
        title: r.title,
        payload: r.payload,
      })),
    },
  });
}

// ── Sender actions ───────────────────────────────────────────────────

async function sendSenderAction(
  recipientId: string,
  action: string,
): Promise<unknown> {
  return callApi("/me/messages", "POST", {
    recipient: { id: recipientId },
    sender_action: action,
  });
}

export async function sendTypingOn(recipientId: string): Promise<unknown> {
  return sendSenderAction(recipientId, "typing_on");
}

export async function sendTypingOff(recipientId: string): Promise<unknown> {
  return sendSenderAction(recipientId, "typing_off");
}

export async function sendMarkSeen(recipientId: string): Promise<unknown> {
  return sendSenderAction(recipientId, "mark_seen");
}

// ── User profile ─────────────────────────────────────────────────────

export async function getUserProfile(
  userId: string,
): Promise<{ name?: string; profile_pic?: string; username?: string }> {
  return callApi(
    `/${userId}?fields=name,profile_pic,username`,
    "GET",
  ) as Promise<{ name?: string; profile_pic?: string; username?: string }>;
}
