import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PerspectiveBook } from "@/components/ui/perspective-book";

const px = { fontFamily: "'Press Start 2P', monospace" };
const logo = { fontFamily: "'Nunito', sans-serif" };
const serif = { fontFamily: "'Spencer', serif" };
const bitterSour = { fontFamily: "'Bitter Sour', cursive" };
const display = { fontFamily: "'Rubik Glitch', system-ui" };

const API = import.meta.env.VITE_API_URL || "";

/* ─── Boot sequence overlay ─── */
function BootSequence({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const bootLines = [
    "DITTO MATCHMAKING ENGINE v2.0.26",
    "LOADING ROMANCE MODULES...",
    "CALIBRATING HEART SENSORS... OK",
    "SCANNING FOR PLAYERS... ██████ DONE",
    "MATCH ALGORITHM READY",
    "",
    "> PRESS START",
  ];
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < bootLines.length) { setLines(prev => [...prev, bootLines[i]]); i++; }
      else { clearInterval(id); setTimeout(onDone, 400); }
    }, 150);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="fixed inset-0 z-[200] bg-[#111827] flex items-center justify-center px-6" style={px}>
      <div className="max-w-md w-full">
        {lines.map((line, i) => (
          <p key={i} className={`text-[8px] sm:text-[10px] leading-[2.5] ${
            line === "> PRESS START" ? "text-[#ffec27] animate-blink-slow mt-2" :
            line.includes("OK") || line.includes("DONE") || line.includes("READY") ? "text-[#00e436]" :
            "text-[#6366f1]"
          }`}>{line}</p>
        ))}
        <span className="inline-block w-[8px] h-[14px] bg-[#6366f1] ml-1 align-middle" style={{ animation: "blink-pixel 0.5s step-end infinite" }} />
      </div>
    </div>
  );
}

/* ─── CRT overlay ─── */
function CrtOverlay() {
  return (<><div className="crt-vignette" /><div className="crt-scanlines" /><div className="power-line" /></>);
}

/* ─── Scroll-based level indicator ─── */
function LevelIndicator() {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const pct = Math.min(window.scrollY / (document.body.scrollHeight - window.innerHeight), 1);
      const newLevel = Math.max(1, Math.min(7, Math.floor(pct * 7) + 1));
      setLevel(newLevel);
      setXp(Math.round((pct * 7 - Math.floor(pct * 7)) * 100));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-1 pointer-events-none" style={px}>
      <span className="text-[7px] text-[#ffec27]">LVL {level}</span>
      <div className="w-[50px] h-[6px] border border-[#6366f1]/40 overflow-hidden" style={{ imageRendering: "pixelated" }}>
        <div className="h-full bg-[#6366f1] transition-all duration-300" style={{ width: `${xp}%` }} />
      </div>
    </div>
  );
}

/* ─── Pixel particles ─── */
function PixelParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    left: `${(i * 17 + 7) % 100}%`,
    size: i % 3 === 0 ? 3 : 2,
    duration: 8 + (i % 5) * 4,
    delay: (i * 1.3) % 7,
    color: ["#6366f1", "#ec4899", "#ffffff", "#ffec27", "#6366f1"][i % 5],
  }));
  return (
    <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div key={i} className="absolute animate-pixel-fall" style={{
          left: p.left, width: p.size, height: p.size, background: p.color, opacity: 0.3,
          animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, imageRendering: "pixelated",
        }} />
      ))}
    </div>
  );
}

/* ─── Pixel box ─── */
function PixelBox({ children, className = "", color = "#fff", beam = false }: { children: React.ReactNode; className?: string; color?: string; beam?: boolean }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        border: `4px solid ${color}`,
        boxShadow: `4px 4px 0 ${color}, -4px -4px 0 ${color}, 4px -4px 0 ${color}, -4px 4px 0 ${color}`,
        imageRendering: "pixelated",
      }}
    >
      {beam && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <div
            className="absolute w-8 h-8 rounded-full animate-border-beam"
            style={{ background: `radial-gradient(circle, ${color}, transparent)`, filter: "blur(4px)" }}
          />
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── VS badge ─── */
function VsBadge() {
  return (
    <div className="flex flex-col items-center gap-2 px-1">
      <div className="w-1 h-6" style={{ background: "#64748b" }} />
      <div className="px-3 py-2 text-[14px] sm:text-[18px] text-[#ffec27] shrink-0"
        style={{ border: "4px solid #ffec27", background: "#1c2444", boxShadow: "4px 4px 0 #3730a3", textShadow: "2px 2px 0 #3730a3" }}>
        VS
      </div>
      <div className="w-1 h-6" style={{ background: "#64748b" }} />
    </div>
  );
}

/* ─── Team slot card ─── */
function SlotCard({ label, name, filled, color, onClick }: {
  label: string; name?: string | null; filled: boolean; color: string; onClick?: () => void;
}) {
  const dark = color === "#ec4899" ? "#9d174d" : "#3730a3";
  return (
    <div
      className={`flex flex-col items-center gap-2 w-[70px] sm:w-[90px] ${!filled && onClick ? "cursor-pointer group" : ""}`}
      onClick={() => !filled && onClick?.()}
    >
      <div
        className="w-full aspect-square flex items-center justify-center transition-colors"
        style={{
          border: filled ? `4px solid ${color}` : `4px dashed ${color}44`,
          background: filled ? "#1c2444" : "#111827",
          boxShadow: filled ? `3px 3px 0 ${dark}` : "none",
        }}
      >
        {filled ? (
          <span className="text-[20px] sm:text-[24px]">{color === "#ec4899" ? "👩" : "🧑"}</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[16px] sm:text-[20px] group-hover:text-[#ffec27] transition-none" style={{ color: `${color}66` }}>+</span>
            {onClick && <span className="text-[5px] sm:text-[6px] group-hover:text-[#ffec27] transition-none" style={{ color: `${color}44` }}>TAP TO INVITE</span>}
          </div>
        )}
      </div>
      <span className="text-[6px] sm:text-[7px] text-center" style={{ color: filled ? color : "#64748b" }}>
        {filled ? (name || label) : label}
      </span>
      {filled && (
        <div className="px-2 py-0.5 text-[5px] sm:text-[6px] uppercase tracking-wider"
          style={{ background: color, color: "#111827" }}>
          ready
        </div>
      )}
    </div>
  );
}

/* ─── Scroll reveal ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(30px)", transition: "opacity 0.7s ease-out, transform 0.7s ease-out" } as React.CSSProperties };
}

/* ─── Countdown to next Wednesday 7 PM PST ─── */
function useCountdown() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    function getNext() {
      const now = new Date();
      const pst = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      const day = pst.getDay();
      let daysUntil = (3 - day + 7) % 7;
      if (daysUntil === 0 && pst.getHours() >= 19) daysUntil = 7;
      const target = new Date(pst);
      target.setDate(pst.getDate() + daysUntil);
      target.setHours(19, 0, 0, 0);
      return target.getTime() - pst.getTime();
    }
    const tick = () => {
      const ms = getNext();
      const s = Math.floor(ms / 1000);
      setTime({ d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ─── Countdown digit ─── */
function CountdownDigit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1">
        {str.split("").map((ch, i) => (
          <div key={i} className="w-[28px] sm:w-[44px] h-[36px] sm:h-[56px] bg-[#1c2444] border-2 border-[#6366f1] flex items-center justify-center"
            style={{ boxShadow: "0 0 8px #6366f133" }}>
            <span className="text-[16px] sm:text-[28px] text-[#ffffff] tabular-nums">{ch}</span>
          </div>
        ))}
      </div>
      <span className="text-[6px] sm:text-[7px] text-[#64748b] mt-1.5 uppercase tracking-widest">{label}</span>
    </div>
  );
}

/* ─── Blinking cursor ─── */
function BlinkCursor() {
  return (
    <span className="inline-block w-[12px] h-[22px] bg-white ml-1 align-middle"
      style={{ animation: "blink-pixel 1s step-end infinite" }} />
  );
}

/* ─── Pixel stars ─── */
function PixelStars() {
  const stars = [
    { x: "8%", y: "12%", delay: "0s" }, { x: "92%", y: "8%", delay: "0.5s" },
    { x: "85%", y: "35%", delay: "1s" }, { x: "5%", y: "55%", delay: "1.5s" },
    { x: "90%", y: "65%", delay: "0.3s" }, { x: "15%", y: "80%", delay: "0.8s" },
    { x: "75%", y: "90%", delay: "1.2s" },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <div key={i} className="fixed w-2 h-2 bg-yellow-300 z-0 pointer-events-none" style={{
          left: s.x, top: s.y, animation: `twinkle-pixel 2s step-end infinite`,
          animationDelay: s.delay, imageRendering: "pixelated",
        }} />
      ))}
    </>
  );
}

/* ─── Photo marquee ─── */
function PhotoMarquee() {
  const photos = [
    { src: "/1.jpg" }, { src: "/2.jpg" }, { src: "/3.jpg" },
    { src: "/4.jpg" }, { src: "/5.jpg" }, { src: "/6.jpg" },
    { src: "/7.jpg", rotate90: true }, { src: "/8.jpg" }, { src: "/9.jpg" },
  ];
  const colors = ["#ffffff", "#6366f1", "#ffec27", "#ec4899", "#ffffff", "#6366f1", "#ffec27", "#ec4899", "#ffffff"];
  const allPhotos = [...photos, ...photos];
  return (
    <div className="overflow-hidden">
      <div className="flex gap-4 sm:gap-6" style={{ animation: "marquee-scroll 80s linear infinite", width: "max-content" }}>
        {allPhotos.map((p, i) => (
          <div key={i} className="shrink-0 overflow-hidden"
            style={{ border: `4px solid ${colors[i % colors.length]}`, boxShadow: `0 0 20px ${colors[i % colors.length]}22` }}>
            <img src={p.src} alt="" className="h-[200px] sm:h-[300px] object-cover block"
              style={{
                width: "auto", minWidth: p.rotate90 ? "300px" : "260px", maxWidth: p.rotate90 ? "300px" : "400px",
                ...(p.rotate90 ? { transform: "rotate(270deg)", transformOrigin: "center center", objectFit: "contain" as const } : {}),
              }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FAQ accordion ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-2 border-[#ec4899]/20">
      <button onClick={() => setOpen(!open)} className="w-full py-4 sm:py-5 flex items-center justify-between text-left gap-4 group" style={px}>
        <span className="text-[#ffffff] text-[9px] sm:text-[12px] leading-[2]">{q}</span>
        <span className="text-[#ec4899] text-[14px] shrink-0 transition-transform duration-500" style={{ transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: open ? "200px" : "0", opacity: open ? 1 : 0 }}>
        <p className="text-[#cbd5e1] text-[8px] sm:text-[11px] leading-[2.2] pb-4 sm:pb-5 pl-2">{a}</p>
      </div>
    </div>
  );
}

/* ─── Screen shake ─── */
function useScreenShake() {
  const [shaking, setShaking] = useState(false);
  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 300); };
  return { shaking, shake };
}


/* ═══ Page ═══ */
type LobbyState = "landing" | "creating" | "lobby" | "pending";

export function DoublesPage() {
  const navigate = useNavigate();
  const countdown = useCountdown();
  const { shaking, shake } = useScreenShake();
  const [booted, setBooted] = useState(() => sessionStorage.getItem("ditto-booted") === "1");
  const [view, setView] = useState<LobbyState>("landing");
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [createData, setCreateData] = useState({ name: "", phone: "", role: "" as "guy" | "girl" | "" });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // lobby state
  const [lobbyCode, setLobbyCode] = useState("");
  const [mySide, setMySide] = useState<"guy" | "girl">("guy");
  const [myName, setMyName] = useState("");
  const [slots, setSlots] = useState<{ label: string; name: string | null; filled: boolean; side: "guy" | "girl" }[]>([]);

  const howItWorks = useReveal();
  const experiences = useReveal();
  const quote = useReveal();
  const igDemo = useReveal();
  const manual = useReveal();
  const faq = useReveal();
  const signupRef = useRef<HTMLDivElement>(null);

  const scrollToSignup = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const inputClass =
    "w-full px-3 sm:px-4 py-3 border-4 border-[#6366f1] bg-[#1c2444] text-white text-[11px] placeholder:text-[#6366f1]/40 focus:outline-none focus:border-[#ffec27] h-[48px]";

  // Track pending signup state
  const [pendingSignup, setPendingSignup] = useState<{ name: string; code: string; gender: string } | null>(null);

  useEffect(() => {
    // Check if user has an active team — redirect to party page
    const teamCode = localStorage.getItem("ditto-team-code");
    if (teamCode) {
      navigate(`/party/${teamCode}`);
      return;
    }

    // Check for completed registration first
    const saved = sessionStorage.getItem("ditto-user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.name && user.teamCode) {
          setMyName(user.name);
          setLobbyCode(user.teamCode);
          setView("lobby");
          setSlots([
            { label: "YOU", name: user.name, filled: true, side: "guy" },
            { label: "FRIEND", name: null, filled: false, side: "guy" },
            { label: "???", name: null, filled: false, side: "girl" },
            { label: "???", name: null, filled: false, side: "girl" },
          ]);
          return;
        }
      } catch { /* ignore */ }
    }

    // Check for pending signup (form done, but hasn't DM'd ditto yet)
    const pending = localStorage.getItem("ditto-pending-signup");
    if (pending) {
      try {
        const data = JSON.parse(pending);
        if (data.name && data.code) {
          setPendingSignup(data);
          setMyName(data.name);
          setView("landing"); // stay on landing, slot 1 will show "DM DITTO"
        }
      } catch { /* ignore */ }
    }
  }, []);

  const handleCreate = () => {
    const { name, phone, role } = createData;
    if (!name.trim() || !phone.trim()) { setCreateError("enter your name and phone"); return; }
    if (!role) { setCreateError("are you a guy or girl?"); return; }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const otherSide = role === "guy" ? "girl" : "guy";
    setLobbyCode(code);
    setMySide(role);
    setMyName(name.trim());
    setSlots([
      { label: "YOU", name: name.trim(), filled: true, side: role },
      { label: "FRIEND", name: null, filled: false, side: role },
      { label: "???", name: null, filled: false, side: otherSide },
      { label: "???", name: null, filled: false, side: otherSide },
    ]);
    setView("lobby");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/party/${lobbyCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    {!booted && <BootSequence onDone={() => { setBooted(true); sessionStorage.setItem("ditto-booted", "1"); }} />}
    <div className={`min-h-screen relative overflow-x-hidden ${shaking ? "animate-screen-shake" : ""}`} style={px}>
      <CrtOverlay />
      <PixelParticles />
      <LevelIndicator />

      {/* Background */}
      <div className="fixed inset-0 z-0" style={{ background: "#111827" }} />
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }} />
      <PixelStars />

      {/* Toast notification */}
      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-up">
          <div className="px-5 sm:px-6 py-3 border-4 border-[#00e436] bg-[#111827] text-center" style={{ boxShadow: "4px 4px 0 #065f46" }}>
            <p className="text-[#00e436] text-[9px] sm:text-[11px]" style={px}>INVITE LINK COPIED!</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b-4 border-[#ec4899] bg-[#1c2444]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button onClick={() => { setView("landing"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="leading-none" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <span className="text-white text-[18px] sm:text-[22px] font-normal" style={display}>dtd</span>
          </button>
          <div className="flex items-center gap-2 sm:gap-4">
            {lobbyCode && (
              <div className="w-2 h-2 bg-[#00e436] animate-pulse" />
            )}
            <button onClick={() => navigate("/signin")} className="text-[#cbd5e1] text-[8px] sm:text-[11px] hover:text-[#ffec27] transition-none py-2">
              [ SIGN IN ]
            </button>
            <span className="text-[#64748b] text-[8px] sm:text-[11px]">|</span>
            <button onClick={scrollToSignup} className="text-[#ec4899] text-[8px] sm:text-[11px] hover:text-[#ffec27] transition-none py-2">
              [ JOIN ]
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════
          HERO — sticky full viewport with lobby built in
          ════════════════════════════════════════════════════════════ */}
      <section className="sticky top-0 z-10 min-h-[100svh] flex flex-col items-center justify-center px-4 sm:px-6 -mb-[100svh] overflow-hidden py-20"
        style={{ background: "#111827" }}>

        {/* Sunset background */}
        <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
          <img src="/lasunset.jpg" alt="" className="w-full h-full object-cover" style={{ filter: "blur(10px) brightness(0.35) saturate(1.3)", transform: "scale(1.05)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(17,24,39,0.6) 0%, rgba(17,24,39,0.3) 40%, rgba(17,24,39,0.7) 100%)" }} />
        </div>

        <div className="relative z-10 animate-fade-up w-full max-w-4xl mx-auto">

          {/* Logo + tagline — always visible */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative inline-block">
              <h1 className="text-[52px] sm:text-[85px] lg:text-[110px] leading-none tracking-[0.02em] text-[#ec4899] text-shimmer relative z-10" style={display}>
                double the date
              </h1>
              <h1 className="text-[52px] sm:text-[85px] lg:text-[110px] leading-none tracking-[0.02em] text-[#6366f1] absolute top-0 left-0 animate-glitch-1 pointer-events-none" style={display} aria-hidden>
                double the date
              </h1>
              <h1 className="text-[52px] sm:text-[85px] lg:text-[110px] leading-none tracking-[0.02em] text-[#ffec27] absolute top-0 left-0 animate-glitch-2 pointer-events-none" style={display} aria-hidden>
                double the date
              </h1>
            </div>
            <p className="mt-3 sm:mt-4 text-[#cbd5e1] text-[16px] sm:text-[26px] lg:text-[32px] leading-[1.3]" style={serif}>
              every wednesday
            </p>
            <p className="mt-1 text-[#ffec27] text-[8px] sm:text-[10px]">
              you + friend vs mystery duo<BlinkCursor />
            </p>
          </div>

          {/* ── Landing: 2v2 arena with sign up slot ── */}
          {view === "landing" && (
            <div className="max-w-2xl mx-auto">
              <PixelBox color="#6366f1" className="bg-[#1c2444] p-5 sm:p-8">

                {/* ── Mobile: 2x2 grid (you/mystery per row) ── */}
                <div className="sm:hidden">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <p className="text-[#6366f1] text-[8px] text-center uppercase tracking-wider">your duo</p>
                    <p className="text-[#ec4899] text-[8px] text-center uppercase tracking-wider">mystery duo</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {pendingSignup ? (
                      <div className="flex flex-col items-center gap-2 cursor-pointer group"
                        onClick={() => { window.location.href = `https://ig.me/m/ditto.test?ref=signup_${pendingSignup.code}`; }}>
                        <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ffec27] bg-[#111827]"
                          style={{ animation: "arcade-glow 2s ease-in-out infinite" }}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[7px] text-[#ffec27]">{pendingSignup.name.split(" ")[0]}</span>
                          </div>
                        </div>
                        <div className="px-3 py-1 text-[7px] uppercase tracking-wider bg-[#ffec27] text-[#111827]">DM DITTO</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate("/signup")}>
                        <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ec4899] bg-[#111827] group-hover:border-[#ffec27] transition-none">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[18px] text-[#ec4899] group-hover:text-[#ffec27]">▶</span>
                            <span className="text-[7px] text-[#ec4899] group-hover:text-[#ffec27]">SIGN UP</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ec489944] bg-[#111827]">
                        <span className="text-[18px] text-[#ec489944]">?</span>
                      </div>
                      <span className="text-[7px] text-[#64748b]">???</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#6366f144] bg-[#111827]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[18px] text-[#6366f166]">+</span>
                          <span className="text-[7px] text-[#6366f144]">YOUR FRIEND</span>
                        </div>
                      </div>
                      <span className="text-[7px] text-[#64748b]">FRIEND</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ec489944] bg-[#111827]">
                        <span className="text-[18px] text-[#ec489944]">?</span>
                      </div>
                      <span className="text-[7px] text-[#64748b]">???</span>
                    </div>
                  </div>
                  {/* VS mobile */}
                  <div className="flex items-center justify-center my-4">
                    <div className="flex-1 h-[2px] bg-[#6366f1]/20" />
                    <span className="px-4 text-[14px] text-[#ffec27]" style={{ ...px, textShadow: "2px 2px 0 #A16207" }}>VS</span>
                    <div className="flex-1 h-[2px] bg-[#ec4899]/20" />
                  </div>
                </div>

                {/* ── Desktop: [you + friend] VS [??? + ???] horizontal ── */}
                <div className="hidden sm:block">
                  <div className="flex items-center justify-center gap-4 max-w-[700px] mx-auto">
                    {/* Your duo side */}
                    <div className="w-[240px]">
                      <p className="text-[#6366f1] text-[9px] text-center uppercase tracking-wider mb-3">your duo</p>
                      <div className="grid grid-cols-2 gap-4">
                        {pendingSignup ? (
                          <div className="flex flex-col items-center gap-2 cursor-pointer group"
                            onClick={() => { window.location.href = `https://ig.me/m/ditto.test?ref=signup_${pendingSignup.code}`; }}>
                            <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ffec27] bg-[#111827]"
                              style={{ animation: "arcade-glow 2s ease-in-out infinite" }}>
                              <span className="text-[8px] text-[#ffec27]">{pendingSignup.name.split(" ")[0]}</span>
                            </div>
                            <div className="px-3 py-1 text-[7px] uppercase tracking-wider bg-[#ffec27] text-[#111827]">DM DITTO</div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate("/signup")}>
                            <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ec4899] bg-[#111827] group-hover:border-[#ffec27] transition-none">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[22px] text-[#ec4899] group-hover:text-[#ffec27]">▶</span>
                                <span className="text-[8px] text-[#ec4899] group-hover:text-[#ffec27]">SIGN UP</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#6366f144] bg-[#111827]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[22px] text-[#6366f166]">+</span>
                              <span className="text-[7px] text-[#6366f144]">FRIEND</span>
                            </div>
                          </div>
                          <span className="text-[7px] text-[#64748b]">FRIEND</span>
                        </div>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-[2px] h-6" style={{ background: "linear-gradient(180deg, transparent, #6366f144)" }} />
                      <span className="text-[18px] text-[#ffec27] px-3 py-2 border-4 border-[#ffec27]"
                        style={{ ...px, textShadow: "2px 2px 0 #A16207", background: "#111827", boxShadow: "4px 4px 0 #A16207" }}>VS</span>
                      <div className="w-[2px] h-6" style={{ background: "linear-gradient(180deg, #ec489944, transparent)" }} />
                    </div>

                    {/* Mystery duo side */}
                    <div className="w-[240px]">
                      <p className="text-[#ec4899] text-[9px] text-center uppercase tracking-wider mb-3">mystery duo</p>
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ec489944] bg-[#111827]">
                              <span className="text-[22px] text-[#ec489944]">?</span>
                            </div>
                            <span className="text-[7px] text-[#64748b]">???</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center">
                  {pendingSignup ? (
                    <p className="text-[#ffec27] text-[9px] sm:text-[10px] leading-[2]">
                      DM @ditto.test to finish signing up — just say hey
                    </p>
                  ) : (
                    <p className="text-[#64748b] text-[9px] sm:text-[10px] leading-[2]">
                      sign up to claim your slot.<br />
                      <span className="text-[#ffec27]">grab a friend and get matched every wednesday.</span>
                    </p>
                  )}
                </div>
              </PixelBox>

              {/* Join with code */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-[#64748b] text-[7px] sm:text-[8px]">HAVE A CODE?</span>
                <input type="text" value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  placeholder="CODE"
                  className="px-3 py-2 w-[100px] border-4 border-[#6366f1] bg-[#1c2444] text-white text-[10px] text-center tracking-[0.2em] placeholder:text-[#6366f1]/40 focus:outline-none focus:border-[#ffec27]"
                  style={px} />
                <button onClick={() => { if (joinCode.length >= 4) navigate(`/party/${joinCode}`); }}
                  className="px-3 py-2 border-4 border-[#6366f1] bg-[#6366f1] text-white text-[9px] hover:bg-white hover:border-white hover:text-[#111827] active:translate-x-[2px] active:translate-y-[2px] transition-none"
                  style={{ boxShadow: "3px 3px 0 #3730a3" }}>
                  JOIN
                </button>
              </div>

              {/* Countdown */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <CountdownDigit value={countdown.d} label="days" />
                  <span className="text-[#6366f1] text-[14px] sm:text-[22px] self-start mt-1 animate-blink-slow">:</span>
                  <CountdownDigit value={countdown.h} label="hrs" />
                  <span className="text-[#6366f1] text-[14px] sm:text-[22px] self-start mt-1 animate-blink-slow">:</span>
                  <CountdownDigit value={countdown.m} label="min" />
                  <span className="text-[#6366f1] text-[14px] sm:text-[22px] self-start mt-1 animate-blink-slow">:</span>
                  <CountdownDigit value={countdown.s} label="sec" />
                </div>
                <p className="mt-2 text-[#64748b] text-[6px] sm:text-[7px] text-center">NEXT MATCH DROP: WEDNESDAY 7 PM</p>
              </div>
            </div>
          )}

          {/* ── Create Lobby — inline in hero ── */}
          {view === "creating" && (
            <div className="max-w-sm mx-auto">
              <PixelBox color="#ec4899" className="bg-[#1c2444] p-5 sm:p-8">
                <h2 className="text-[14px] sm:text-[18px] text-white mb-1 text-center" style={serif}>start a lobby</h2>
                <p className="text-[#64748b] text-[7px] sm:text-[8px] mb-5 text-center">enter your info to create a party</p>
                <div className="space-y-3">
                  <input type="text" value={createData.name} onChange={e => setCreateData(d => ({ ...d, name: e.target.value }))}
                    placeholder="> name" className={inputClass} style={px} />
                  <input type="tel" value={createData.phone} onChange={e => setCreateData(d => ({ ...d, phone: fmt(e.target.value) }))}
                    placeholder="> phone" className={inputClass} style={px} />
                  <div>
                    <p className="text-[#64748b] text-[7px] mb-2">I'M A...</p>
                    <div className="flex gap-2">
                      {(["guy", "girl"] as const).map(role => (
                        <button key={role} onClick={() => setCreateData(d => ({ ...d, role }))}
                          className="flex-1 py-3 text-[10px] border-4 active:translate-y-[2px] transition-none"
                          style={{
                            borderColor: role === "guy" ? "#6366f1" : "#ec4899",
                            background: createData.role === role ? (role === "guy" ? "#6366f1" : "#ec4899") : "transparent",
                            color: createData.role === role ? "#111827" : (role === "guy" ? "#6366f1" : "#ec4899"),
                            boxShadow: createData.role === role ? `3px 3px 0 ${role === "guy" ? "#3730a3" : "#9d174d"}` : "none",
                          }}>
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  {createError && <p className="text-[9px] text-white text-center">! {createError}</p>}
                  <button onClick={handleCreate} disabled={creating}
                    className="w-full py-3 border-4 border-[#ec4899] bg-[#ec4899] text-[#111827] text-[10px] sm:text-[12px] hover:bg-white hover:border-white active:translate-x-[2px] active:translate-y-[2px] transition-none disabled:opacity-50"
                    style={{ boxShadow: "4px 4px 0 #9d174d" }}>
                    {creating ? "LOADING..." : "CREATE PARTY"}
                  </button>
                  <button onClick={() => setView("landing")} className="w-full py-2 text-[#64748b] text-[8px] hover:text-[#ffec27] transition-none">[ BACK ]</button>
                </div>
              </PixelBox>
            </div>
          )}

          {/* ── Lobby arena — inline in hero ── */}
          {view === "lobby" && (
            <div className="max-w-2xl mx-auto">
              <PixelBox color="#6366f1" className="bg-[#1c2444] p-4 sm:p-8">
                <div className="flex items-center justify-center gap-3 sm:gap-5">
                  <div className="text-center flex-1">
                    <p className="text-[#ec4899] text-[7px] sm:text-[8px] mb-3 uppercase">{mySide === "guy" ? "guys" : "girls"}</p>
                    <div className="flex justify-center gap-3 sm:gap-4">
                      {slots.filter(s => s.side === mySide).map((s, i) => (
                        <SlotCard key={i} label={s.label} name={s.name} filled={s.filled}
                          color={mySide === "guy" ? "#6366f1" : "#ec4899"} onClick={!s.filled ? copyLink : undefined} />
                      ))}
                    </div>
                  </div>
                  <VsBadge />
                  <div className="text-center flex-1">
                    <p className="text-white/40 text-[7px] sm:text-[8px] mb-3 uppercase">mystery duo</p>
                    <div className="flex justify-center gap-3 sm:gap-4">
                      {slots.filter(s => s.side !== mySide).map((s, i) => (
                        <SlotCard key={i} label={s.label} name={s.name} filled={s.filled}
                          color={mySide === "guy" ? "#ec4899" : "#6366f1"} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t-2 border-[#6366f1]/20 text-center">
                  {slots.find(s => s.side === mySide && !s.filled)
                    ? <p className="text-[#444] text-[8px] sm:text-[10px] leading-[2]">invite your friend to complete your duo.<br /><span className="text-[#ffec27]">we'll match you with another pair.</span></p>
                    : <p className="text-[#00e436] text-[8px] sm:text-[10px] leading-[2]">your duo is set — waiting for ditto to match you</p>
                  }
                </div>
              </PixelBox>

              {/* Share code */}
              <div className="mt-6 text-center">
                <p className="text-[#64748b] text-[7px] sm:text-[8px] mb-2">SEND THIS TO YOUR FRIEND</p>
                <p className="text-[20px] sm:text-[28px] tracking-[0.3em] text-[#6366f1] select-all mb-3" style={px}>{lobbyCode}</p>
                <button onClick={copyLink}
                  className="px-6 py-3 border-4 border-[#ffec27] bg-[#ffec27] text-[#111827] text-[9px] sm:text-[11px] hover:bg-white hover:border-white active:translate-x-[2px] active:translate-y-[2px] transition-none"
                  style={{ boxShadow: "4px 4px 0 #a38a1a" }}>
                  {copied ? "COPIED!" : "COPY INVITE LINK"}
                </button>
              </div>

              {/* Countdown below lobby */}
              <div className="mt-6 flex items-center justify-center gap-2 sm:gap-3">
                <CountdownDigit value={countdown.d} label="days" />
                <span className="text-[#6366f1] text-[14px] sm:text-[22px] self-start mt-1 animate-blink-slow">:</span>
                <CountdownDigit value={countdown.h} label="hrs" />
                <span className="text-[#6366f1] text-[14px] sm:text-[22px] self-start mt-1 animate-blink-slow">:</span>
                <CountdownDigit value={countdown.m} label="min" />
                <span className="text-[#6366f1] text-[14px] sm:text-[22px] self-start mt-1 animate-blink-slow">:</span>
                <CountdownDigit value={countdown.s} label="sec" />
              </div>
              <p className="mt-2 text-[#64748b] text-[6px] sm:text-[7px] text-center">NEXT MATCH DROP: WEDNESDAY 7 PM</p>
            </div>
          )}

          {/* ── Pending: form done, need to DM ditto ── */}
          {view === "pending" && pendingSignup && (
            <div className="max-w-2xl mx-auto">
              <PixelBox color="#6366f1" className="bg-[#1c2444] p-4 sm:p-8">
                <div className="flex items-center justify-center gap-3 sm:gap-5">
                  {/* Your side */}
                  <div className="text-center flex-1">
                    <p className="text-[#6366f1] text-[7px] sm:text-[8px] mb-3 uppercase">
                      {pendingSignup.gender === "Male" ? "guys" : "girls"}
                    </p>
                    <div className="flex justify-center gap-3 sm:gap-4">
                      {/* Slot 1: YOU — needs to DM */}
                      <div className="flex flex-col items-center gap-2 w-[70px] sm:w-[90px] cursor-pointer group"
                        onClick={() => window.open("https://ig.me/m/ditto.test?ref=signup_" + pendingSignup.code, "_blank")}>
                        <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ffec27] bg-[#111827] group-hover:bg-[#1c2444] transition-none"
                          style={{ animation: "arcade-glow 2s ease-in-out infinite" }}>
                          <div className="flex flex-col items-center gap-1">
                            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                              <rect width="28" height="28" rx="6" fill="#E1306C" />
                              <path d="M14 8.87c-2.8 0-5.13 2.3-5.13 5.13S11.2 19.13 14 19.13 19.13 16.83 19.13 14 16.8 8.87 14 8.87zm0 8.47a3.34 3.34 0 110-6.68 3.34 3.34 0 010 6.68z" fill="white"/>
                            </svg>
                          </div>
                        </div>
                        <span className="text-[6px] sm:text-[7px] text-[#ffec27]">{pendingSignup.name.split(" ")[0]}</span>
                        <div className="px-2 py-0.5 text-[5px] sm:text-[6px] uppercase tracking-wider bg-[#ffec27] text-[#111827]">
                          DM DITTO
                        </div>
                      </div>
                      {/* Slot 2: Friend */}
                      <div className="flex flex-col items-center gap-2 w-[70px] sm:w-[90px]">
                        <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#6366f144] bg-[#111827]">
                          <span className="text-[16px] sm:text-[20px] text-[#6366f166]">+</span>
                        </div>
                        <span className="text-[6px] sm:text-[7px] text-[#64748b]">FRIEND</span>
                      </div>
                    </div>
                  </div>

                  <VsBadge />

                  {/* Other side — mystery */}
                  <div className="text-center flex-1">
                    <p className="text-[#ec4899] text-[7px] sm:text-[8px] mb-3 uppercase">
                      {pendingSignup.gender === "Male" ? "girls" : "guys"}
                    </p>
                    <div className="flex justify-center gap-3 sm:gap-4">
                      {[1, 2].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2 w-[70px] sm:w-[90px]">
                          <div className="w-full aspect-square flex items-center justify-center border-4 border-dashed border-[#ec489944] bg-[#111827]">
                            <span className="text-[16px] sm:text-[20px] text-[#ec489944]">?</span>
                          </div>
                          <span className="text-[6px] sm:text-[7px] text-[#64748b]">???</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-[#6366f1]/20 text-center">
                  <p className="text-[#ffec27] text-[8px] sm:text-[10px] leading-[2]">
                    DM @ditto.test to finish signing up — just say hey
                  </p>
                </div>
              </PixelBox>

              <div className="mt-6 text-center">
                <a href={`https://ig.me/m/ditto.test?ref=signup_${pendingSignup.code}`}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 active:scale-[0.98] transition-transform"
                  style={{ borderRadius: "50px", textDecoration: "none" }}>
                  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                    <rect width="28" height="28" rx="6" fill="#E1306C" />
                    <path d="M14 8.87c-2.8 0-5.13 2.3-5.13 5.13S11.2 19.13 14 19.13 19.13 16.83 19.13 14 16.8 8.87 14 8.87zm0 8.47a3.34 3.34 0 110-6.68 3.34 3.34 0 010 6.68z" fill="white"/>
                  </svg>
                  <span className="text-[#111827] text-[13px]" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
                    Open @ditto.test
                  </span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-subtle">
          <span className="text-[#64748b] text-[7px]">SCROLL</span>
          <span className="text-[#6366f1] text-[14px]">▼</span>
        </div>
      </section>

      {/* Spacer so content scrolls over the sticky hero */}
      <div className="h-[100svh] relative z-0 pointer-events-none" />

      {/* ════════════════════════════════════════════════════════════
          SCROLL SECTIONS
          ════════════════════════════════════════════════════════════ */}
      <div className="relative z-20">
        {/* Fade from hero into content */}
        <div className="h-[120px] -mt-[120px] relative z-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #111827)" }} />

        {/* Shadows background wrap */}
        <div className="relative"
          style={{ backgroundImage: "linear-gradient(to bottom, #111827 0%, transparent 30%, transparent 70%, #111827 100%), url(/shadows.jpg)", backgroundAttachment: "fixed", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="relative z-10 bg-[#111827]/60">

        {/* Divider */}
        <div className="py-6 sm:py-10 flex items-center justify-center gap-4 sm:gap-6">
          <div className="h-px flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-r from-transparent to-[#ec4899]/40" />
          <span className="text-[#ec4899]/60 text-[7px] sm:text-[9px] tracking-[0.3em] uppercase">every wednesday</span>
          <div className="h-px flex-1 max-w-[80px] sm:max-w-[120px] bg-gradient-to-l from-transparent to-[#ec4899]/40" />
        </div>

        {/* ─── How it works ─── */}
        <section className="py-16 sm:py-32 px-4 sm:px-6">
          <div ref={howItWorks.ref} style={howItWorks.style}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-center text-[24px] sm:text-[40px] text-[#ffffff] mb-4 sm:mb-6" style={serif}>how to play</h2>
              <p className="text-center text-[#ec4899] text-[9px] sm:text-[11px] mb-12 sm:mb-16">— SELECT STAGE —</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {[
                  { n: "01", title: "sign up", desc: "fill out the form + DM @ditto.test on IG", color: "#ec4899" },
                  { n: "02", title: "invite your duo", desc: "forward the invite to your friend on instagram", color: "#6366f1" },
                  { n: "03", title: "the wednesday drop", desc: "we match your duo with another duo", color: "#ffec27" },
                  { n: "04", title: "show up", desc: "4 people, 1 night. zero awkwardness.", color: "#00e436" },
                ].map((step) => (
                  <div key={step.n} className="text-center group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 border-4 flex items-center justify-center bg-[#1c2444]"
                      style={{ borderColor: step.color, boxShadow: `0 0 20px ${step.color}33` }}>
                      <span className="text-[16px] sm:text-[22px]" style={{ color: step.color }}>{step.n}</span>
                    </div>
                    <h3 className="text-[#ffffff] text-[10px] sm:text-[12px] mb-2">{step.title}</h3>
                    <p className="text-[#cbd5e1] text-[8px] sm:text-[10px] leading-[2]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Scattered photos ─── */}
        <section className="py-16 sm:py-28 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-[#ec4899]/60 text-[8px] sm:text-[10px] tracking-[0.25em] uppercase mb-3 sm:mb-4">what it looks like</p>
            <h2 className="text-center text-[22px] sm:text-[36px] text-[#ffffff] mb-8 sm:mb-14" style={serif}>the ditto experience</h2>
            <div className="relative mx-auto" style={{ height: "clamp(380px, 65vw, 580px)", maxWidth: "800px" }}>
              <div className="absolute left-[0%] sm:left-[2%] top-[0%] w-[48%] sm:w-[44%]" style={{ transform: "rotate(-4deg)", zIndex: 2 }}>
                <div className="rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
                  <img src="/dinner.jpg" alt="" className="w-full aspect-square object-cover block" style={{ filter: "brightness(0.85) contrast(1.05)" }} />
                </div>
              </div>
              <div className="absolute right-[0%] sm:right-[2%] top-[4%] w-[46%] sm:w-[42%]" style={{ transform: "rotate(3deg)", zIndex: 1 }}>
                <div className="rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
                  <img src="/japanesedinner.jpg" alt="" className="w-full aspect-[3/2] object-cover block" style={{ filter: "brightness(0.85) contrast(1.1)" }} />
                </div>
              </div>
              <div className="absolute left-[12%] sm:left-[18%] bottom-[0%] w-[52%] sm:w-[46%]" style={{ transform: "rotate(1.5deg)", zIndex: 4 }}>
                <div className="rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
                  <img src="/happy.jpg" alt="" className="w-full aspect-square object-cover block" style={{ filter: "brightness(0.9) contrast(1.05)" }} />
                </div>
              </div>
              <div className="absolute right-[0%] sm:right-[4%] bottom-[2%] w-[38%] sm:w-[34%]" style={{ transform: "rotate(-2.5deg)", zIndex: 3 }}>
                <div className="rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
                  <img src="/nighttime.jpg" alt="" className="w-full aspect-square object-cover block" style={{ filter: "brightness(0.8) contrast(1.1)" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Photo marquee ─── */}
        <section className="py-16 sm:py-24 overflow-hidden">
          <div ref={experiences.ref} style={experiences.style}>
            <div className="text-center mb-8 sm:mb-12 px-4">
              <h2 className="text-[22px] sm:text-[36px] text-[#ffffff]" style={serif}>
                <span className="text-[#ec4899]">real</span> dates delivered
              </h2>
            </div>
            <PhotoMarquee />
          </div>
        </section>

          </div>
        </div>

        {/* ─── Content over photos ─── */}
        <div className="relative z-20 bg-[#111827]">

          {/* ─── Instagram DM demo ─── */}
          <section className="py-16 sm:py-32 px-4 sm:px-6">
            <div ref={igDemo.ref} style={igDemo.style}>
              <div className="max-w-4xl mx-auto card-spotlight"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
                }}>
              <PixelBox color="#6366f1" className="bg-[#1c2444] p-5 sm:p-12">
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 sm:gap-12 lg:gap-16">

                  {/* Mock Instagram DM conversation */}
                  <div className="shrink-0 w-[280px] sm:w-[340px] rounded-[36px] overflow-hidden" style={{ fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif", background: "#000" }}>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-3 pb-1">
                      <span className="text-white text-[12px] font-semibold">9:41</span>
                      <div className="flex items-center gap-1">
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="white"><rect x="0" y="6" width="3" height="6" rx="0.5"/><rect x="4.5" y="4" width="3" height="8" rx="0.5"/><rect x="9" y="1.5" width="3" height="10.5" rx="0.5"/><rect x="13" y="0" width="3" height="12" rx="0.5"/></svg>
                        <svg width="22" height="12" viewBox="0 0 22 12" fill="none"><rect x="0.5" y="0.5" width="19" height="11" rx="2" stroke="white"/><rect x="2" y="2" width="14" height="8" rx="1" fill="#34C759"/><rect x="20.5" y="3.5" width="1.5" height="5" rx="0.5" fill="white"/></svg>
                      </div>
                    </div>
                    {/* IG header — back arrow, profile pic + name + active, phone/video icons */}
                    <div className="flex items-center px-3 pt-1 pb-2 gap-3">
                      <svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10 2L2 10L10 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <img src="/ditto.jpeg" alt="" className="w-9 h-9 rounded-full object-cover" style={{ border: "2px solid #444" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[13px] font-semibold leading-tight">ditto_ucr</p>
                        <p className="text-[#8e8e8e] text-[11px] leading-tight">Active now</p>
                      </div>
                      {/* Phone icon */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {/* Video icon */}
                      <svg width="24" height="22" viewBox="0 0 24 24" fill="none"><path d="M23 7l-7 5 7 5V7z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="5" width="15" height="14" rx="2" stroke="white" strokeWidth="1.5"/></svg>
                    </div>
                    {/* Divider */}
                    <div className="h-px bg-[#262626]" />
                    {/* Messages */}
                    <div className="px-3 pb-2 pt-2 flex flex-col gap-[5px]" style={{ background: "#000" }}>
                      <p className="text-[#8e8e8e] text-[10px] text-center my-1">Wed 6:52 PM</p>
                      {/* Received — IG uses #262626 bg, fully rounded pills */}
                      <div className="flex items-end gap-2">
                        <img src="/ditto.jpeg" alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        <div className="max-w-[78%] bg-[#262626] px-3 py-[8px] rounded-[20px]">
                          <p className="text-white text-[14px] leading-[1.4]">ayyy we found your double date 👀</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="w-6 shrink-0" />
                        <div className="max-w-[78%] bg-[#262626] px-3 py-[8px] rounded-[20px]">
                          <p className="text-white text-[14px] leading-[1.4]">you + austin are going out with lily & leona</p>
                        </div>
                      </div>
                      {/* Photos */}
                      <div className="flex items-end gap-2">
                        <div className="w-6 shrink-0" />
                        <div className="grid grid-cols-2 gap-[2px] w-[65%] overflow-hidden rounded-[16px]">
                          <img src="/lilyz.jpg" alt="" className="w-full aspect-[3/4] object-cover block" />
                          <img src="/leona.jpg" alt="" className="w-full aspect-[3/4] object-cover block" />
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="w-6 shrink-0" />
                        <div className="max-w-[78%] bg-[#262626] px-3 py-[8px] rounded-[20px]">
                          <p className="text-white text-[14px] leading-[1.4]">wednesday 7pm @ Kit Coffee ☕</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="w-6 shrink-0" />
                        <div className="max-w-[78%] bg-[#262626] px-3 py-[8px] rounded-[20px]">
                          <p className="text-white text-[14px] leading-[1.4]">they already said yes so no backing out 😤</p>
                        </div>
                      </div>
                      <div className="h-1" />
                      {/* Sent — IG gradient purple→blue */}
                      <div className="self-end max-w-[70%] px-3 py-[8px] rounded-[20px]" style={{ background: "linear-gradient(135deg, #833ab4, #405de6)" }}>
                        <p className="text-white text-[14px] leading-[1.4]">say less 🫡</p>
                      </div>
                      {/* Seen with tiny pfp */}
                      <div className="self-end flex items-center gap-1 mr-1 mt-[1px]">
                        <img src="/ditto.jpeg" alt="" className="w-3 h-3 rounded-full object-cover" />
                      </div>
                      {/* IG input bar */}
                      <div className="flex items-center gap-2 mt-2">
                        {/* Camera circle */}
                        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #405de6, #833ab4, #e1306c, #fd1d1d)" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4" fill="none" stroke="#833ab4" strokeWidth="2"/></svg>
                        </div>
                        <div className="flex-1 h-[36px] rounded-full border border-[#363636] flex items-center justify-between px-3">
                          <span className="text-[#8e8e8e] text-[14px]">Message...</span>
                          <div className="flex items-center gap-3">
                            {/* Mic icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="#8e8e8e" strokeWidth="1.5"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="#8e8e8e" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            {/* Image icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#8e8e8e" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#8e8e8e"/><path d="M21 15l-5-5L5 21" stroke="#8e8e8e" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            {/* Sticker icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#8e8e8e" strokeWidth="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#8e8e8e" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Home indicator */}
                    <div className="flex justify-center pb-2 pt-1" style={{ background: "#000" }}>
                      <div className="w-[120px] h-[4px] rounded-full bg-white/30" />
                    </div>
                  </div>

                  <div className="lg:pt-8">
                    <p className="text-[#ec4899] text-[9px] sm:text-[11px] mb-4 sm:mb-5">no app needed</p>
                    <h2 className="text-[20px] sm:text-[32px] lg:text-[40px] text-[#ffffff] leading-[1.4] mb-4 sm:mb-5"
                      style={{ ...serif, textShadow: "0 0 20px #ffffff22" }}>
                      doubles lives in your DMs.
                    </h2>
                    <p className="text-[#cbd5e1] text-[9px] sm:text-[11px] leading-[2.2] max-w-sm">
                      we match your duo with another duo, plan the double date, and DM you everything through @ditto.test on instagram. all 4 of you just show up.
                    </p>
                    <div className="mt-6 sm:mt-8 inline-block bg-[#6366f1] text-[#1c2444] px-3 sm:px-4 py-2 text-[9px] sm:text-[11px]"
                      style={{ boxShadow: "0 0 12px #6366f144" }}>
                      all through instagram DMs
                    </div>
                  </div>
                </div>
              </PixelBox>
              </div>
            </div>
          </section>

          {/* ─── Quote ─── */}
          <section className="py-20 sm:py-36 px-4 sm:px-6">
            <div ref={quote.ref} style={quote.style}>
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-[20px] sm:text-[28px] lg:text-[34px] text-[#ffffff]/90 leading-[2]" style={serif}>
                  "Going on a date alone is{" "}
                  <span className="text-[#ec4899]/60">terrifying.</span><br />
                  Going with your best friend?{" "}
                  <span className="text-[#ffffff]" style={{ textShadow: "0 0 20px rgba(255,255,255,0.3)" }}>legendary.</span>"
                </p>
              </div>
            </div>
          </section>

          {/* ─── Example Lobby ─── */}
          <section className="py-16 sm:py-24 px-4 sm:px-6">
            <div className="max-w-lg mx-auto">
              <p className="text-[#64748b] text-[6px] sm:text-[8px] mb-4 tracking-widest text-center">EXAMPLE LOBBY</p>
              <PixelBox color="#6366f1" className="bg-[#1c2444] p-4 sm:p-6">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <div className="text-center flex-1">
                    <p className="text-[#6366f1] text-[6px] sm:text-[7px] mb-3 uppercase">guys</p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {[{ name: "Jake" }, { name: "Ethan" }].map((p, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 w-[50px] sm:w-[65px]">
                          <div className="w-full aspect-square flex items-center justify-center"
                            style={{ border: "3px solid #6366f1", background: "#1c2444", boxShadow: "2px 2px 0 #3730a3" }}>
                            <span className="text-[16px] sm:text-[20px]">🧑</span>
                          </div>
                          <span className="text-[5px] sm:text-[6px] text-[#6366f1]">{p.name}</span>
                          <div className="px-1.5 py-0.5 text-[4px] sm:text-[5px] uppercase bg-[#6366f1] text-[#111827]">ready</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-1">
                    <div className="w-1 h-4" style={{ background: "#64748b" }} />
                    <div className="px-2 py-1 text-[10px] sm:text-[12px] text-[#ffec27]"
                      style={{ border: "3px solid #ffec27", background: "#1c2444", boxShadow: "3px 3px 0 #3730a3" }}>VS</div>
                    <div className="w-1 h-4" style={{ background: "#64748b" }} />
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[#ec4899] text-[6px] sm:text-[7px] mb-3 uppercase">girls</p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {[{ name: "Mia" }, { name: "Lily" }].map((p, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 w-[50px] sm:w-[65px]">
                          <div className="w-full aspect-square flex items-center justify-center"
                            style={{ border: "3px solid #ec4899", background: "#1c2444", boxShadow: "2px 2px 0 #9d174d" }}>
                            <span className="text-[16px] sm:text-[20px]">👩</span>
                          </div>
                          <span className="text-[5px] sm:text-[6px] text-[#ec4899]">{p.name}</span>
                          <div className="px-1.5 py-0.5 text-[4px] sm:text-[5px] uppercase bg-[#ec4899] text-[#111827]">ready</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t-2 border-[#6366f1]/20 text-center">
                  <p className="text-[#00e436] text-[6px] sm:text-[8px] leading-[2]">party's full — double date this wednesday</p>
                </div>
              </PixelBox>
            </div>
          </section>

          {/* signupRef anchor — nav "JOIN" scrolls to top */}
          <div ref={signupRef} />

          {/* ─── FAQ ─── */}
          <section className="py-16 sm:py-32 px-4 sm:px-6">
            <div ref={faq.ref} style={faq.style}>
              <div className="max-w-2xl mx-auto bg-[#1c2444]/40 border-4 border-[#6366f1]/20 p-5 sm:p-10">
                <h2 className="text-[#ffffff] text-[14px] sm:text-[20px] mb-6 sm:mb-8">FAQ</h2>
                <FaqItem q="How does it work?" a="You and a friend sign up as a duo. Every Wednesday we match your duo with another duo and plan the double date — all through Instagram DMs." />
                <FaqItem q="Do I need an app?" a="No. Everything happens through Instagram DMs with @ditto.test and this website." />
                <FaqItem q="Do I need a teammate?" a="Yes — grab a friend and sign up together. That's the whole point." />
                <FaqItem q="What if we don't like our match?" a="Reply 'no' when Ditto asks. Both duos go back in the pool for next week." />
                <FaqItem q="Is it free?" a="Yes." />
              </div>
            </div>
          </section>

          {/* ─── Final CTA ─── */}
          <section className="py-24 sm:py-40 px-4 sm:px-6 text-center relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center bottom, rgba(236,72,153,0.06) 0%, transparent 70%)" }} />
            <div className="relative z-10">
              <p className="text-[28px] sm:text-[44px] lg:text-[52px] text-[#ffffff] leading-[1.3]" style={serif}>
                you don't swipe.<br />you squad up.
              </p>
              <button
                onClick={() => { shake(); scrollToSignup(); }}
                className="mt-10 sm:mt-14 mx-auto flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-white hover:bg-gray-100 active:scale-[0.97] transition-transform"
                style={{ borderRadius: "50px" }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                  <defs>
                    <radialGradient id="ig-grad-cta" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497"/>
                      <stop offset="5%" stopColor="#fdf497"/>
                      <stop offset="45%" stopColor="#fd5949"/>
                      <stop offset="60%" stopColor="#d6249f"/>
                      <stop offset="90%" stopColor="#285AEB"/>
                    </radialGradient>
                  </defs>
                  <rect width="28" height="28" rx="7" fill="url(#ig-grad-cta)" />
                  <rect x="5.5" y="5.5" width="17" height="17" rx="5" stroke="white" strokeWidth="2" fill="none"/>
                  <circle cx="14" cy="14" r="4" stroke="white" strokeWidth="2" fill="none"/>
                  <circle cx="19.5" cy="8.5" r="1.5" fill="white"/>
                </svg>
                <span className="text-[#111827] text-[14px] sm:text-[16px]" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
                  DM @ditto.test
                </span>
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-10 sm:py-14 px-4 sm:px-6 border-t border-white/[0.06]">
            <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
              <span className="text-white text-[18px] font-bold" style={display}>dtd</span>
              <p className="text-[#64748b] text-[10px] sm:text-[12px]" style={{ fontFamily: "'Inter', sans-serif" }}>double dates every wednesday</p>
              <p className="text-[#64748b]/40 text-[9px] sm:text-[10px] mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>&copy; 2026 ditto</p>
            </div>
          </footer>

        </div>
      </div>
    </div>
    </>
  );
}
