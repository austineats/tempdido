import { Router } from "express";
import { prisma } from "../lib/db.js";

export const adminRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ditto2026";

// Simple auth middleware
function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${ADMIN_PASSWORD}`) return next();
  return res.status(401).json({ ok: false, error: "unauthorized" });
}

adminRouter.use(requireAuth);

// GET /stats — overview stats
adminRouter.get("/stats", async (_req, res) => {
  try {
    const totalProfiles = await prisma.bublProfile.count();
    const totalTeams = await prisma.blindDateTeam.count();
    const fullTeams = await prisma.blindDateTeam.count({ where: { status: "full" } });
    const totalMessages = await prisma.bublChatHistory.count();
    const recentMessages = await prisma.bublChatHistory.count({
      where: { created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    return res.json({
      ok: true,
      stats: { totalProfiles, totalTeams, fullTeams, totalMessages, recentMessages },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

// GET /profiles — all profiles
adminRouter.get("/profiles", async (_req, res) => {
  try {
    const profiles = await prisma.bublProfile.findMany({
      orderBy: { created_at: "desc" },
      take: 200,
    });
    return res.json({ ok: true, profiles });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

// GET /teams — all teams
adminRouter.get("/teams", async (_req, res) => {
  try {
    const teams = await prisma.blindDateTeam.findMany({
      orderBy: { created_at: "desc" },
      take: 100,
    });
    return res.json({ ok: true, teams });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

// GET /chats — recent conversations grouped by user
adminRouter.get("/chats", async (_req, res) => {
  try {
    const messages = await prisma.bublChatHistory.findMany({
      orderBy: { created_at: "desc" },
      take: 500,
    });

    // Group by phone/ig_id
    const convos = new Map<string, typeof messages>();
    for (const m of messages) {
      const key = m.ig_id || m.phone;
      if (!convos.has(key)) convos.set(key, []);
      convos.get(key)!.push(m);
    }

    // Sort each convo chronologically
    const grouped = Array.from(convos.entries()).map(([userId, msgs]) => ({
      userId,
      messages: msgs.sort((a, b) => a.created_at.getTime() - b.created_at.getTime()),
      lastActivity: msgs[0].created_at,
    }));

    return res.json({ ok: true, conversations: grouped });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

// GET /chat/:userId — single conversation
adminRouter.get("/chat/:userId", async (req, res) => {
  try {
    const messages = await prisma.bublChatHistory.findMany({
      where: {
        OR: [
          { phone: req.params.userId },
          { ig_id: req.params.userId },
        ],
      },
      orderBy: { created_at: "asc" },
      take: 200,
    });
    return res.json({ ok: true, messages });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});
