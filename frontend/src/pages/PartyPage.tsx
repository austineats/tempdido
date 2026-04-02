import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const px = { fontFamily: "'Press Start 2P', monospace" } as const;

const GIRL_NAMES = [
  "Vivian", "Grace", "Amy", "Jennifer", "Michelle", "Jessica", "Tiffany", "Stephanie",
  "Alice", "Cindy", "Emily", "Sophia", "Chloe", "Hannah", "Olivia", "Angela",
  "May", "Jane", "Mia", "Abigail", "Natalie", "Harper", "Evelyn", "Hana",
  "Mina", "Yuna", "Sakura", "Mei", "Aiko", "Yuki", "Emi", "Reina",
  "Rin", "Sora", "Miyuki", "Misaki", "Nozomi", "Seoyeon", "Bora", "Jina",
];

const BOY_NAMES = [
  "Andrew", "Eric", "Kevin", "Peter", "Albert", "David", "Daniel", "Jason",
  "Justin", "Michael", "Brian", "Brandon", "Ryan", "Alex", "Andy", "Alan",
  "Sam", "Ethan", "Noah", "Liam", "Lucas", "Aiden", "Nathan", "Tyler",
  "Kenji", "Hiroshi", "Haruki", "Kaito", "Riku", "Minjun", "Seojun", "Joon",
  "Sungho", "Taeyang", "Jungwoo", "Minho", "Ren", "Jin", "Felix", "Victor",
];

/* ─── Player slot ─── */
function PlayerSlot({ name, filled, ready, onInvite, inviteCopied }: {
  name?: string; filled: boolean; ready?: boolean;
  onInvite?: () => void; inviteCopied?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 w-[100px] sm:w-[140px]">
      <div
        className="w-full aspect-[3/4] flex items-center justify-center p-2"
        style={{
          border: `4px solid ${filled ? "#7C3AED" : "#6B7280"}`,
          borderStyle: filled ? "solid" : "dashed",
          background: filled ? "rgba(124,58,237,0.08)" : "#0B0014",
          boxShadow: filled ? "4px 4px 0 #4C1D95" : "none",
        }}
      >
        {filled ? (
          ready ? (
            <span className="text-[11px] sm:text-[16px] text-[#34D399]" style={px}>READY</span>
          ) : (
            <span className="text-[8px] sm:text-[11px] text-[#FACC15]" style={{ ...px, animation: "blink-pixel 2s step-end infinite" }}>NOT READY</span>
          )
        ) : (
          <button
            onClick={onInvite}
            className="px-2 sm:px-4 py-1.5 sm:py-2 text-[6px] sm:text-[9px] active:translate-y-[2px]"
            style={{
              ...px,
              border: `3px solid ${inviteCopied ? "#34D399" : "#7C3AED"}`,
              background: inviteCopied ? "#34D399" : "#7C3AED",
              color: inviteCopied ? "#0B0014" : "#fff",
              boxShadow: `2px 2px 0 ${inviteCopied ? "#065F46" : "#4C1D95"}`,
            }}
          >
            {inviteCopied ? "COPIED!" : "INVITE"}
          </button>
        )}
      </div>
      <div
        className="w-full py-2 text-center text-[8px] sm:text-[9px]"
        style={{
          ...px,
          border: `4px solid ${filled ? "#7C3AED" : "#6B7280"}`,
          background: filled ? "#7C3AED" : "transparent",
          color: filled ? "#fff" : "#6B7280",
          boxShadow: filled ? "3px 3px 0 #4C1D95" : "none",
        }}
      >
        {filled ? (name || "P1") : "???"}
      </div>
    </div>
  );
}

/* ─── TBD match slot with spinning names ─── */
function TbdSlot({ index, matchGender }: { index: number; matchGender: "girl" | "boy" }) {
  const names = matchGender === "girl" ? GIRL_NAMES : BOY_NAMES;
  const [idx, setIdx] = useState(() => (index * 11) % names.length);

  useEffect(() => {
    const id = setInterval(() => setIdx(prev => (prev + 1) % names.length), 100);
    return () => clearInterval(id);
  }, [names]);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 w-[100px] sm:w-[140px]">
      <div
        className="w-full aspect-[3/4] flex items-center justify-center"
        style={{
          border: "4px solid #C084FC",
          background: "#0B0014",
          boxShadow: "4px 4px 0 #6D28D9",
        }}
      >
        <span className="text-[18px] sm:text-[22px]" style={{ ...px, color: "#C084FC" }}>TBD</span>
      </div>
      <div
        className="w-full py-2 text-center text-[7px] sm:text-[8px] overflow-hidden"
        style={{ ...px, border: "4px solid #C084FC", background: "#C084FC", color: "#fff", boxShadow: "3px 3px 0 #6D28D9" }}
      >
        <span className="inline-block w-[70px] sm:w-[80px] text-center overflow-hidden">
          {names[idx % names.length]}
        </span>
      </div>
    </div>
  );
}

/* ─── VS badge ─── */
function VsBadge() {
  return (
    <div
      className="px-3 py-2 text-[14px] sm:text-[18px] text-[#FACC15] self-center shrink-0"
      style={{
        ...px,
        border: "4px solid #FACC15",
        background: "#12081F",
        boxShadow: "4px 4px 0 #A16207",
        textShadow: "2px 2px 0 #A16207",
      }}
    >
      VS
    </div>
  );
}

/* ═══ Page ═══ */
export function PartyPage() {
  const navigate = useNavigate();
  const { code } = useParams();

  // Demo state — in production this would come from backend
  const player1 = { name: "You", ready: false };
  const player2 = null as { name: string; ready: boolean } | null;
  const teamFull = player2 !== null;
  const playerCount = teamFull ? 2 : 1;

  const teamCode = code || "demo";
  const inviteLink = `https://ig.me/m/weakgarages?ref=invite_${teamCode}`;
  const inviteText = `join my x2 double date team! 🎯 ${inviteLink}`;
  const [inviteCopied, setInviteCopied] = useState(false);

  const sendInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my x2 team!", text: inviteText, url: inviteLink });
        return;
      } catch { /* user cancelled or share failed, fall through to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    } catch { /* clipboard not available */ }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={px}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src="/bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(12px)", imageRendering: "pixelated", transform: "scale(1.05)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(11,0,20,0.88) 0%, rgba(13,6,41,0.85) 40%, rgba(11,0,20,0.9) 100%)" }} />
      </div>
      {/* Scanlines */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="w-full z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <a href="/" className="leading-none" style={{ fontFamily: "'Bitter Sour', cursive", textDecoration: "none" }}>
              <span style={{ color: "#FACC15", fontSize: "20px" }}>x</span>
              <span style={{ color: "#FACC15", fontSize: "28px" }}>2</span>
            </a>
            <span className="text-[#FACC15] text-[7px] sm:text-[9px]">&lt; 2v2 LOBBY &gt;</span>
          </div>
        </nav>

        {/* Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-5 py-8 sm:py-12 gap-6 sm:gap-10">

          {/* Title */}
          <div className="text-center">
            <p className="text-[#C084FC] text-[9px] sm:text-[10px] mb-3">&lt; DOUBLE DATE MODE &gt;</p>
            <h1 className="text-[16px] sm:text-[28px] lg:text-[34px] text-[#E8DEF8] leading-[1.6] tracking-[-0.05em]">
              {teamFull ? (
                <span className="text-[#FACC15]">ready up</span>
              ) : (
                <>Double the <span className="text-[#FACC15]">Date</span></>
              )}
            </h1>
          </div>

          {/* Player count */}
          <div
            className="px-4 sm:px-5 py-2 text-[8px] sm:text-[13px]"
            style={{
              border: `4px solid ${teamFull ? "#34D399" : "#FACC15"}`,
              background: "#12081F",
              color: teamFull ? "#34D399" : "#FACC15",
              boxShadow: `4px 4px 0 ${teamFull ? "#065F46" : "#A16207"}`,
            }}
          >
            [ {playerCount} / 2 ] PLAYERS JOINED
          </div>

          {/* 2v2 Arena */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4 lg:gap-8">
            {/* Your side */}
            <div className="flex gap-4 sm:gap-5">
              <PlayerSlot name={player1.name} filled ready={player1.ready} />
              {teamFull ? (
                <PlayerSlot name={player2!.name} filled ready={player2!.ready} />
              ) : (
                <PlayerSlot filled={false} onInvite={sendInvite} />
              )}
            </div>

            <VsBadge />

            {/* Opponent side — TBD spinning */}
            <div className="flex gap-4 sm:gap-5">
              <TbdSlot index={1} matchGender="girl" />
              <TbdSlot index={2} matchGender="girl" />
            </div>
          </div>

          {/* Message */}
          <p className="text-[#A5B4C8] text-[7px] sm:text-[10px] text-center leading-[2] sm:leading-[2.2] max-w-xs sm:max-w-sm px-2">
            {teamFull
              ? "Both teammates are in! x2 will find your match and DM you on Wednesday."
              : "Invite your friend to join your team. Once both slots are filled, x2 will find your match!"
            }
          </p>

          {/* Action button */}
          {teamFull ? (
            <a
              href="https://ig.me/m/x2byditto"
              className="px-6 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[13px] active:translate-x-[2px] active:translate-y-[2px] inline-block text-center"
              style={{
                border: "4px solid #34D399",
                background: "#34D399",
                color: "#0B0014",
                boxShadow: "4px 4px 0 #065F46",
              }}
            >
              &gt; READY UP — DM @x2byditto
            </a>
          ) : (
            <button
              onClick={sendInvite}
              className="px-6 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[13px] active:translate-x-[2px] active:translate-y-[2px]"
              style={{
                border: "4px solid #FACC15",
                background: inviteCopied ? "#34D399" : "#FACC15",
                color: "#0B0014",
                boxShadow: inviteCopied ? "4px 4px 0 #065F46" : "4px 4px 0 #A16207",
              }}
            >
              {inviteCopied ? "LINK COPIED!" : "> INVITE FRIEND"}
            </button>
          )}

          {/* Status blink */}
          <p
            className="text-[#6B7280] text-[7px] sm:text-[8px] uppercase"
            style={{ animation: "blink-pixel 1.5s step-end infinite" }}
          >
            {teamFull ? "dm @x2byditto to ready up..." : "waiting for player 2..."}
          </p>

          {/* How it works */}
          <div className="mt-8 pt-8 w-full max-w-lg" style={{ borderTop: "4px solid #7C3AED" }}>
            <p className="text-[8px] uppercase tracking-widest mb-6 text-center" style={{ color: "#FACC15" }}>how it works</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { step: "01", text: "sign up with a friend as a duo" },
                { step: "02", text: "x2 matches your duo with another duo" },
                { step: "03", text: "wednesday hits — double date time" },
              ].map((s) => (
                <div key={s.step}>
                  <span className="text-[10px]" style={{ color: "#8B5CF6" }}>{s.step}</span>
                  <p className="text-[7px] mt-2 leading-relaxed" style={{ color: "#A5B4C8" }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
