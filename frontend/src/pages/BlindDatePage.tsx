import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

const px = { fontFamily: "'Press Start 2P', monospace" };

/* ─── Custom pixel select dropdown ─── */
function PixelSelect({ value, onChange, placeholder, options, className = "" }: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 sm:px-4 border-4 border-[#7C3AED] bg-[#12081F] text-left text-[11px] focus:outline-none focus:border-[#A78BFA] h-[48px] flex items-center justify-between"
        style={px}
      >
        <span className={value ? "text-white" : "text-[#7C3AED]/40"}>
          {value ? options.find(o => o.value === value)?.label || value : placeholder}
        </span>
        <span className="text-[#7C3AED] text-[8px]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 border-4 border-[#7C3AED] bg-[#12081F] max-h-[200px] overflow-y-auto" style={{ boxShadow: "4px 4px 0 #4C1D95" }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-3 py-2.5 text-left text-[9px] sm:text-[11px] min-h-[40px] ${
                value === opt.value ? "bg-[#7C3AED] text-white" : "text-white hover:bg-[#7C3AED]/20"
              }`}
              style={px}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


/* ─── Pixel border box ─── */
function PixelBox({ children, className = "", color = "#fff" }: { children: React.ReactNode; className?: string; color?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        border: `4px solid ${color}`,
        boxShadow: `4px 4px 0 ${color}, -4px -4px 0 ${color}, 4px -4px 0 ${color}, -4px 4px 0 ${color}`,
        imageRendering: "pixelated",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Blinking pixel cursor ─── */
function BlinkCursor() {
  return (
    <span
      className="inline-block w-[12px] h-[22px] bg-white ml-1 align-middle"
      style={{ animation: "blink-pixel 1s step-end infinite" }}
    />
  );
}

/* ─── Pixel X ─── */
function PixelX({ size = 48 }: { size?: number }) {
  const grid = [
    'XX...XX',
    'XX...XX',
    '.XX.XX.',
    '..XXX..',
    '.XX.XX.',
    'XX...XX',
    'XX...XX',
  ];
  const w = 7, h = 7, p = size / w;
  return (
    <svg width={size} height={p * h} style={{ imageRendering: 'pixelated' }}>
      {grid.flatMap((row, y) => [...row].map((c, x) =>
        c === 'X' ? <rect key={`${x}-${y}`} x={x*p} y={y*p} width={p+.5} height={p+.5} fill="#FACC15" /> : null
      ))}
    </svg>
  );
}

/* ─── Pixel 2 ─── */
function Pixel2({ size = 48 }: { size?: number }) {
  const grid = [
    '.XX.',
    'X..X',
    '...X',
    '..X.',
    '.X..',
    'XXXX',
  ];
  const w = 4, h = 6, p = size / w;
  return (
    <svg width={size} height={p * h} style={{ imageRendering: 'pixelated' }}>
      {grid.flatMap((row, y) => [...row].map((c, x) =>
        c === 'X' ? <rect key={`${x}-${y}`} x={x*p} y={y*p} width={p+.5} height={p+.5} fill="#FACC15" /> : null
      ))}
    </svg>
  );
}

/* ─── Pixel star decorations ─── */
function PixelStars() {
  const stars = [
    { x: "8%", y: "12%", delay: "0s" },
    { x: "92%", y: "8%", delay: "0.5s" },
    { x: "85%", y: "35%", delay: "1s" },
    { x: "5%", y: "55%", delay: "1.5s" },
    { x: "90%", y: "65%", delay: "0.3s" },
    { x: "15%", y: "80%", delay: "0.8s" },
    { x: "75%", y: "90%", delay: "1.2s" },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          className="fixed w-2 h-2 bg-[#C084FC] z-0 pointer-events-none"
          style={{
            left: s.x,
            top: s.y,
            animation: `twinkle-pixel 2s step-end infinite`,
            animationDelay: s.delay,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </>
  );
}

/* ─── Phone Mockup ─── */
function PhoneMockup() {
  return (
    <div className="w-[280px] sm:w-[340px] shrink-0">
      <img src="/IMG_4250.jpeg" className="w-full rounded-[16px]" alt="Ditto Instagram preview" />
    </div>
  );
}

/* ─── Interactive FAQ accordion ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-4 border-[#7C3AED]/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-4 sm:py-5 flex items-center justify-between text-left gap-4 group"
        style={px}
      >
        <span className="text-[#E8DEF8] text-[9px] sm:text-[12px] leading-[2]">&gt; {q}</span>
        <span
          className="text-[#A78BFA] text-[14px] shrink-0 transition-none"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          {open ? "-" : "+"}
        </span>
      </button>
      {open && (
        <div className="pb-4 sm:pb-5 -mt-1">
          <p className="text-[#A5B4C8] text-[8px] sm:text-[11px] leading-[2.2] pl-4">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ═══ Page ═══ */
type FormState = "idle" | "submitting" | "success";

export function BlindDatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [school, setSchool] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const signupRef = useRef<HTMLDivElement>(null);

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };
  const submit = async () => {
    setError("");
    if (!name.trim() || !phone.trim() || !age.trim() || !gender || !school) { setError("all fields required!"); return; }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 14 || ageNum > 18) { setError("Ditto is currently only reserved for highschoolers."); return; }
    setFormState("submitting");
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("phone", phone.replace(/\D/g, ""));
    fd.append("age", age.trim());
    fd.append("gender", gender);
    fd.append("school", school);
    try {
      const res = await fetch("/api/blind-date/signup", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "something went wrong"); setFormState("idle"); return; }
      const teamCode = data.teamCode || Math.random().toString(36).slice(2, 6).toUpperCase();
      sessionStorage.setItem(`ditto-invite-${teamCode}`, JSON.stringify({ name: name.trim(), gender }));
      navigate(`/invite/${teamCode}`, { replace: true });
    } catch { setError("connection failed — retry!"); setFormState("idle"); }
  };
  const scrollToSignup = () => signupRef.current?.scrollIntoView({ behavior: "smooth" });

  const inputClass =
    "w-full px-3 sm:px-4 py-3 border-4 border-[#7C3AED] bg-[#12081F] text-white text-[11px] placeholder:text-[#7C3AED]/40 focus:outline-none focus:border-[#A78BFA] h-[48px]";

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={px}>

      {/* Background — bg.jpg with dark purple overlay */}
      <div className="fixed inset-0 z-0">
        <img src="/bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(12px)", imageRendering: "pixelated", transform: "scale(1.05)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(11,0,20,0.85) 0%, rgba(13,6,41,0.8) 40%, rgba(11,0,20,0.88) 100%)" }} />
      </div>
      {/* Subtle purple glow orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #8B5CF6, transparent 70%)" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }} />
      </div>
      {/* Scanlines overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)",
        }}
      />
      {/* Pixel grid overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(#8B5CF6 1px, transparent 1px), linear-gradient(90deg, #8B5CF6 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      />

      <PixelStars />

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 w-full z-50">
        <div className="px-8 h-14 sm:h-16 flex items-center justify-between">
          <a href="/" className="leading-none flex items-baseline gap-1.5" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Bitter Sour', cursive" }}>
              <span className="text-[#FACC15] text-[20px]">x</span>
              <span className="text-[#FACC15] text-[28px]">2</span>
            </span>
            <span className="text-[#A5B4C8] text-[7px]" style={px}>by Ditto</span>
          </a>
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <a href="/signin" className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all bg-white/10 text-white hover:bg-white/25 h-7 rounded-full px-3 text-[11px] backdrop-blur-md border border-white/10" style={{ boxShadow: '0 0 15px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.1)' }}>Log In</a>
            <a href="/signup" className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-all bg-white/10 text-white hover:bg-white/25 h-7 rounded-full px-3 text-[11px] backdrop-blur-md border border-white/10" style={{ boxShadow: '0 0 15px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.1)' }}>Join Now</a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 min-h-[100svh] flex flex-col justify-center px-4 sm:px-6 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 sm:gap-14">
          {/* Left — text */}
          <div className="flex-1 order-2 lg:order-1">
            <span className="glitch-text leading-none block mb-3" style={{ fontFamily: "'Bitter Sour', cursive" }}>
              <span className="text-[#FACC15] text-[100px] sm:text-[130px]">x</span>
              <span className="text-[#FACC15] text-[140px] sm:text-[190px] lg:text-[230px]">2</span>
            </span>
            <p className="text-white text-[12px] sm:text-[16px] tracking-[0.2em] uppercase mb-6 sm:mb-8" style={px}>by Ditto</p>

            <p className="text-white text-[10px] sm:text-[15px] leading-[2.2] max-w-lg" style={px}>
              Your preference based duo match maker
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
              <button
                onClick={() => navigate("/signup")}
                className="px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] border-4 border-[#8B5CF6] bg-[#8B5CF6] text-white text-[10px] sm:text-[13px] hover:bg-[#A78BFA] active:translate-x-[2px] active:translate-y-[2px] transition-none"
                style={{ ...px, boxShadow: "4px 4px 0 #4C1D95" }}
              >
                &gt; SIGN UP NOW
              </button>
              <button
                onClick={() => navigate("/party")}
                className="px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] border-4 border-[#FACC15] bg-[#FACC15] text-[#12081F] text-[10px] sm:text-[13px] hover:bg-[#FDE68A] active:translate-x-[2px] active:translate-y-[2px] transition-none"
                style={{ ...px, boxShadow: "4px 4px 0 #A16207" }}
              >
                &gt; 2v2 LOBBY
              </button>
            </div>
          </div>

          {/* Right — photo with glitch frame */}
          <div className="shrink-0 order-1 lg:order-2 self-center">
            <div
              className="glitch-frame relative overflow-hidden"
              style={{
                border: "4px solid #7C3AED",
                transform: "rotate(1.5deg)",
              }}
            >
              <img
                src="/dinner.webp"
                alt="double date"
                className="w-[260px] sm:w-[320px] lg:w-[380px] aspect-[4/3] object-cover block"
              />
              {/* Scanline overlay on photo */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)" }} />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
