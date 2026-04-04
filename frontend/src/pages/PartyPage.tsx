import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const px = { fontFamily: "'Press Start 2P', monospace" } as const;
const display = { fontFamily: "'Rubik Glitch', system-ui" };
const serif = { fontFamily: "'Spencer', serif" };

const API = import.meta.env.VITE_API_URL || "";

/* ─── Floating particles ─── */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
    size: Math.random() > 0.5 ? 2 : 3,
    color: ["#ec4899", "#6366f1", "#ffec27", "#00e436"][i % 4],
  }));
  return (
    <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div key={i} className="absolute rounded-full opacity-40"
          style={{
            left: p.left, bottom: "-10px",
            width: p.size, height: p.size,
            background: p.color,
            animation: `float-up ${p.duration} ${p.delay} ease-out infinite`,
          }} />
      ))}
    </div>
  );
}

/* ─── Glowing player card ─── */
function PlayerCard({ name, ready, color, glow, isYou }: {
  name: string; ready: boolean; color: string; glow: boolean; isYou?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 animate-fade-up">
      <div className="w-full aspect-square flex items-center justify-center border-4 bg-[#111827] relative overflow-hidden"
        style={{
          borderColor: ready ? "#00e436" : color,
          boxShadow: glow ? `0 0 20px ${ready ? "#00e43666" : color + "44"}, inset 0 0 30px ${ready ? "#00e43611" : color + "11"}` : "none",
          transition: "all 0.5s ease",
        }}>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ background: `linear-gradient(135deg, transparent 40%, ${color}33 50%, transparent 60%)`, animation: "shimmer 3s ease-in-out infinite" }} />
        <div className="flex flex-col items-center gap-2 relative z-10">
          <span className="text-[20px] sm:text-[24px]">{ready ? "✓" : "🎮"}</span>
        </div>
      </div>
      <span className="text-[8px] sm:text-[9px] text-center w-full whitespace-nowrap" style={{ ...px, color: ready ? "#00e436" : color }}>
        {name}{isYou ? " (you)" : ""}
      </span>
    </div>
  );
}

/* ─── Mystery card with animated ? ─── */
function MysteryCard() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ec489933] bg-[#111827] relative overflow-hidden">
        <span className="text-[24px] sm:text-[30px] text-[#ec489944]" style={{ animation: "mystery-pulse 2s ease-in-out infinite" }}>?</span>
      </div>
      <span className="text-[8px] text-[#64748b]">???</span>
    </div>
  );
}

/* ─── Invite card ─── */
function InviteCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
      <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed bg-[#111827] relative overflow-hidden"
        style={{
          borderColor: "#6366f144",
          animation: "invite-pulse 2s ease-in-out infinite",
        }}>
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-[24px] text-[#6366f1] group-hover:text-[#ffec27] group-hover:scale-125 transition-transform">+</span>
          <span className="text-[8px] sm:text-[9px] text-[#6366f166] group-hover:text-[#ffec27]">TAP TO INVITE</span>
        </div>
      </div>
    </div>
  );
}

/* ═══ Page ═══ */
export function PartyPage() {
  const { code } = useParams();
  const teamCode = code || "demo";

  const [team, setTeam] = useState<{
    player1: { name: string; gender: string; ready: boolean };
    player2: { name: string; gender: string; ready: boolean } | null;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    if (teamCode === "demo") { setLoading(false); return; }
    const fetchTeam = async () => {
      try {
        const res = await fetch(`${API}/api/bubl/team/${teamCode}`);
        const data = await res.json();
        if (data.ok) {
          setTeam(data.team);
          localStorage.setItem("ditto-team-code", teamCode);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchTeam();
    const interval = setInterval(fetchTeam, 5000);
    return () => clearInterval(interval);
  }, [teamCode]);

  const player1 = team?.player1 || { name: "You", gender: "unknown", ready: false };
  const player2 = team?.player2 || null;
  const teamFull = player2 !== null;
  const playerCount = teamFull ? 2 : 1;

  const sendInvite = async () => {
    const inviteLink = `https://ig.me/m/ditto.test?ref=invite_${teamCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my doubles team!", text: "join my doubles team! 🎯", url: inviteLink });
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2500);
        return;
      } catch {
        // User cancelled share — do nothing
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    } catch { /* */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#111827" }}>
        <div className="w-8 h-8 border-4 border-[#ec4899] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#ffec27] text-[10px]" style={px}>loading lobby...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={px}>
      {/* Toast */}
      {inviteCopied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-up">
          <div className="px-5 py-3 border-4 border-[#00e436] bg-[#111827]" style={{ boxShadow: "4px 4px 0 #065f46" }}>
            <p className="text-[#00e436] text-[9px]" style={px}>INVITE LINK COPIED!</p>
          </div>
        </div>
      )}

      {/* Background — vice city retro */}
      <div className="fixed inset-0 z-0">
        <img src="/vicecity.jpg" alt="" className="w-full h-full object-cover"
          style={{ filter: "saturate(1.6) contrast(1.1) brightness(0.4) hue-rotate(-10deg)", transform: "scale(1.05)" }} />
        {/* Pink/purple tint overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(236,72,153,0.15) 0%, rgba(99,102,241,0.2) 40%, rgba(17,24,39,0.85) 100%)",
          mixBlendMode: "normal",
        }} />
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
        }} />
        {/* CRT flicker */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 50%, transparent 50%)",
          backgroundSize: "100% 4px",
          animation: "crt-flicker 0.1s linear infinite",
        }} />
        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }} />
        {/* Chromatic aberration glow at edges */}
        <div className="absolute inset-0 pointer-events-none" style={{
          boxShadow: "inset 0 0 100px rgba(236,72,153,0.08), inset 0 0 200px rgba(99,102,241,0.05)",
        }} />
      </div>

      <Particles />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="fixed top-0 w-full z-50 border-b-4 border-[#ec4899] bg-[#1c2444]/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <a href="/" className="leading-none" style={{ textDecoration: "none" }}>
              <span className="text-white text-[18px] sm:text-[22px]" style={display}>dtd</span>
            </a>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#00e436] animate-pulse" />
              <span className="text-[#ec4899] text-[7px] sm:text-[9px]">&lt; YOUR LOBBY &gt;</span>
            </div>
          </div>
        </nav>

        {/* Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-12">
          <div className="w-full max-w-2xl mx-auto">

            {/* Title */}
            <div className="text-center mb-8 sm:mb-10 animate-fade-up">
              <div className="relative inline-block">
                <h1 className="text-[42px] sm:text-[70px] leading-none text-[#ec4899]" style={display}>
                  double the date
                </h1>
                <h1 className="text-[42px] sm:text-[70px] leading-none text-[#6366f1] absolute top-0 left-0 animate-glitch-1 pointer-events-none" style={display} aria-hidden="true">
                  double the date
                </h1>
              </div>
              <p className="mt-4 text-[16px] sm:text-[24px]" style={{
                ...serif,
                color: teamFull ? "#00e436" : "#cbd5e1",
                textShadow: teamFull ? "0 0 20px #00e43644" : "none",
              }}>
                {teamFull ? "duo locked in ✓" : "waiting for your duo..."}
              </p>
            </div>

            {/* Player count — animated bar */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-[120px] sm:w-[160px] h-3 bg-[#1c2444] border-2 border-[#6366f1] overflow-hidden">
                  <div className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: teamFull ? "100%" : "50%",
                      background: teamFull ? "linear-gradient(90deg, #00e436, #34d399)" : "linear-gradient(90deg, #ec4899, #6366f1)",
                      boxShadow: `0 0 10px ${teamFull ? "#00e436" : "#ec4899"}`,
                    }} />
                </div>
                <span className="text-[8px] sm:text-[10px]" style={{ color: teamFull ? "#00e436" : "#ffec27" }}>
                  {playerCount}/2
                </span>
              </div>
            </div>

            {/* Arena */}
            <div className="border-4 border-[#6366f1] bg-[#1c2444]/80 backdrop-blur-sm p-5 sm:p-8 relative overflow-hidden"
              style={{ boxShadow: "0 0 30px #6366f122, 6px 6px 0 #3730a3" }}>

              {/* Animated border glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: `inset 0 0 40px ${teamFull ? "#00e43611" : "#6366f111"}` }} />

              {/* ── Mobile: 2x2 grid (guy/girl per row) ── */}
              <div className="sm:hidden">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <p className="text-[#6366f1] text-[8px] text-center uppercase tracking-[0.2em]">your duo</p>
                  <p className="text-[#ec4899] text-[8px] text-center uppercase tracking-[0.2em]">mystery duo</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <PlayerCard name={player1.name.split(" ")[0]} ready={player1.ready} color="#6366f1" glow isYou />
                  <MysteryCard />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {teamFull ? (
                    <PlayerCard name={player2!.name.split(" ")[0]} ready={player2!.ready} color="#6366f1" glow />
                  ) : (
                    <InviteCard onClick={sendInvite} />
                  )}
                  <MysteryCard />
                </div>
              </div>

              {/* ── Desktop: [guy guy] VS [girl girl] horizontal ── */}
              <div className="hidden sm:block">
                <div className="flex items-center justify-center gap-4 max-w-[700px] mx-auto">
                  {/* Guys side */}
                  <div className="w-[240px]">
                    <p className="text-[#6366f1] text-[10px] text-center uppercase tracking-[0.3em] mb-4"
                      style={{ textShadow: "0 0 10px #6366f144" }}>your duo</p>
                    <div className="grid grid-cols-2 gap-4">
                      <PlayerCard name={player1.name.split(" ")[0]} ready={player1.ready} color="#6366f1" glow isYou />
                      {teamFull ? (
                        <PlayerCard name={player2!.name.split(" ")[0]} ready={player2!.ready} color="#6366f1" glow />
                      ) : (
                        <InviteCard onClick={sendInvite} />
                      )}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-[2px] h-8" style={{ background: "linear-gradient(180deg, transparent, #6366f144)" }} />
                    <span className="text-[20px] text-[#ffec27] px-3 py-2 border-4 border-[#ffec27]"
                      style={{ ...px, textShadow: "0 0 15px #ffec2744, 2px 2px 0 #a16207", background: "#111827", boxShadow: "4px 4px 0 #a16207" }}>
                      VS
                    </span>
                    <div className="w-[2px] h-8" style={{ background: "linear-gradient(180deg, #ec489944, transparent)" }} />
                  </div>

                  {/* Girls side */}
                  <div className="w-[240px]">
                    <p className="text-[#ec4899] text-[10px] text-center uppercase tracking-[0.3em] mb-4"
                      style={{ textShadow: "0 0 10px #ec489944" }}>mystery duo</p>
                    <div className="grid grid-cols-2 gap-4">
                      <MysteryCard />
                      <MysteryCard />
                    </div>
                  </div>
                </div>
              </div>

              {/* VS divider — mobile only */}
              <div className="flex items-center justify-center my-5 sm:hidden">
                <div className="flex-1 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #6366f144, transparent)" }} />
                <span className="px-5 text-[16px] text-[#ffec27]"
                  style={{ ...px, textShadow: "0 0 15px #ffec2744, 2px 2px 0 #a16207", animation: "pulse-glow 2s ease-in-out infinite" }}>
                  VS
                </span>
                <div className="flex-1 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #ec489944, transparent)" }} />
              </div>

              {/* Status */}
              <div className="text-center mt-4 sm:mt-6">
                <p className="text-[#94a3b8] text-[9px] sm:text-[10px] leading-[2.2]">
                  {teamFull
                    ? "party's full — double date this wednesday"
                    : "invite your duo to fill the slot. ditto matches you every wednesday."
                  }
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-8 flex justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
              {teamFull ? (
                <div className="px-8 py-3 border-4 border-[#00e436] bg-[#00e436] text-[#111827] text-[10px] sm:text-[12px]"
                  style={{ boxShadow: "0 0 20px #00e43644, 4px 4px 0 #065f46" }}>
                  DUO COMPLETE ✓
                </div>
              ) : (
                <button onClick={sendInvite}
                  className="px-8 py-3 border-4 text-[10px] sm:text-[12px] active:translate-x-[2px] active:translate-y-[2px] hover:scale-[1.02] transition-transform"
                  style={{
                    borderColor: "#ec4899",
                    background: "#ec4899",
                    color: "#111827",
                    boxShadow: "0 0 20px #ec489944, 4px 4px 0 #9d174d",
                  }}>
                  &gt; INVITE YOUR DUO
                </button>
              )}
            </div>

            {/* Blinking status */}
            <p className="text-[#64748b] text-[7px] sm:text-[8px] text-center mt-4 uppercase"
              style={{ animation: "blink-pixel 1.5s step-end infinite" }}>
              {teamFull ? "matched every wednesday..." : "waiting for player 2..."}
            </p>

          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes mystery-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes invite-pulse {
          0%, 100% { border-color: rgba(99, 102, 241, 0.15); }
          50% { border-color: rgba(99, 102, 241, 0.4); }
        }
        @keyframes animate-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: animate-fade-up 0.6s ease-out both;
        }
        @keyframes crt-flicker {
          0% { opacity: 0.02; }
          50% { opacity: 0.04; }
          100% { opacity: 0.02; }
        }
      `}</style>
    </div>
  );
}
