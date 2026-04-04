import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const px = { fontFamily: "'Press Start 2P', monospace" };
const bitterSour = { fontFamily: "'Bitter Sour', cursive" };

const GENDER_OPTIONS = ["Male", "Female", "Non-binary"];
const DATE_WHO_OPTIONS = ["Men", "Women", "Everyone"];
const LOOKING_FOR_OPTIONS = ["Serious relationship", "Casual dates", "New friends", "Not sure yet"];
const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior", "Master's", "PhD", "Other"];
const ETHNICITY_OPTIONS = [
  "Black/African Descent", "White", "East Asian", "South Asian",
  "Middle Eastern", "Pacific Islander", "South East Asian", "Hispanic/Latino",
];
const HEARD_FROM_OPTIONS = ["Poster", "Instagram", "TikTok", "Friend", "Other"];

const API = import.meta.env.VITE_API_URL || "";

export function SignupPage() {
  const navigate = useNavigate();
  // Check if this is a duo invite (User B flow)
  const duoCode = new URLSearchParams(window.location.search).get("duo") || localStorage.getItem("ditto-duo-code") || "";
  const isUserB = !!duoCode;

  // Check if there's already a pending signup — resume at done screen
  // But if this is a duo invite (User B), always start fresh
  const existing = (() => {
    if (isUserB) {
      localStorage.removeItem("ditto-pending-signup");
      localStorage.removeItem("ditto-team-code");
      return null;
    }
    try {
      const saved = localStorage.getItem("ditto-pending-signup");
      if (saved) return JSON.parse(saved) as { name: string; code: string; gender: string };
    } catch {}
    return null;
  })();

  const [step, setStep] = useState(existing ? 4 : 0);

  // basics
  const [name, setName] = useState(existing?.name || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState(existing?.gender || "");
  const [email, setEmail] = useState("");

  // about
  const [ethnicity, setEthnicity] = useState<string[]>([]);
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");

  // preferences
  const [lookingFor, setLookingFor] = useState("");
  const [dateWho, setDateWho] = useState("");

  // photos
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null]);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // meta
  const [heardFrom, setHeardFrom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [signupCode, setSignupCode] = useState(existing?.code || "");

  const toggleEthnicity = (val: string) =>
    setEthnicity(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const addPhoto = (i: number, f: File) => {
    const next = [...photos]; next[i] = f; setPhotos(next);
    const r = new FileReader();
    r.onload = (e) => { const p = [...previews]; p[i] = e.target?.result as string; setPreviews(p); };
    r.readAsDataURL(f);
  };

  const removePhoto = (i: number) => {
    const p = [...photos]; p[i] = null; setPhotos(p);
    const pr = [...previews]; pr[i] = null; setPreviews(pr);
  };

  const inputClass = "w-full border-4 border-[#6366f1] bg-[#1c2444] text-white text-[11px] px-3 py-3 placeholder-white/30 focus:outline-none focus:border-[#ffec27]";
  const chipClass = (active: boolean, color = "#6366f1") =>
    `px-3 py-2 border-4 text-[9px] sm:text-[10px] active:translate-y-[1px] transition-none cursor-pointer ${
      active
        ? `text-[#111827]`
        : `text-[${color}] border-[${color}44] bg-transparent`
    }`;

  // Validation per step
  const canNext = () => {
    if (step === 0) return name.trim() && age && gender && email.includes("@");
    if (step === 1) return true; // about is optional-ish
    if (step === 2) return lookingFor && dateWho;
    return true;
  };

  const submit = async () => {
    if (!name.trim()) { setError("name is required"); return; }

    setError("");
    setSubmitting(true);

    // Generate unique signup code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("phone", `signup_${code}`); // signup code as identifier
      fd.append("age", age);
      fd.append("gender", gender);
      fd.append("email", email.trim());
      fd.append("ethnicity", JSON.stringify(ethnicity));
      fd.append("height", heightFt && heightIn ? `${heightFt}'${heightIn}"` : "");
      fd.append("year", year);
      fd.append("bio", bio.trim());
      fd.append("looking_for", lookingFor);
      fd.append("date_who", dateWho);
      fd.append("heard_from", heardFrom);
      if (duoCode) fd.append("duo_code", duoCode);

      const res = await fetch(`${API}/api/bubl/profile`, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(`save failed: ${data?.error || res.status}. try again.`);
        setSubmitting(false);
        return;
      }

      // User B: profile saved + linked to team — go straight to party
      if (isUserB && data?.team_code) {
        localStorage.setItem("ditto-team-code", data.team_code);
        localStorage.removeItem("ditto-pending-signup");
        setSubmitting(false);
        navigate(`/party/${data.team_code}`);
        return;
      }
    } catch (e) {
      // Retry once in case ngrok interstitial blocked the first request
      try {
        const fd2 = new FormData();
        fd2.append("name", name.trim());
        fd2.append("phone", `signup_${code}`);
        fd2.append("age", age);
        fd2.append("gender", gender);
        fd2.append("email", email.trim());
        if (duoCode) fd2.append("duo_code", duoCode);
        const retry = await fetch(`${API}/api/bubl/profile`, { method: "POST", body: fd2 });
        const retryData = await retry.json().catch(() => null);
        if (isUserB && retryData?.team_code) {
          localStorage.setItem("ditto-team-code", retryData.team_code);
          localStorage.removeItem("ditto-pending-signup");
          setSubmitting(false);
          navigate(`/party/${retryData.team_code}`);
          return;
        }
      } catch {
        console.error("[signup] Retry also failed:", e);
      }
    }

    // User A: save pending signup and show DM ditto screen
    localStorage.setItem("ditto-pending-signup", JSON.stringify({
      name: name.trim(),
      code,
      gender,
      createdAt: Date.now(),
    }));

    setSignupCode(code);
    setStep(4); // go to "done" screen
    setSubmitting(false);
  };

  // Poll for signup completion — auto-redirect to party when bot processes them
  useEffect(() => {
    if (step !== 4 || !signupCode) return;

    // For User B: check if their team has player2_ig_id set
    const pendingTeam = localStorage.getItem("ditto-pending-team");

    const interval = setInterval(async () => {
      try {
        if (pendingTeam) {
          // User B: poll the team endpoint to see if ig_id got linked
          const res = await fetch(`${API}/api/bubl/team/${pendingTeam}`);
          const data = await res.json();
          if (data.ok && data.team?.player2?.ready) {
            clearInterval(interval);
            localStorage.setItem("ditto-team-code", pendingTeam);
            localStorage.removeItem("ditto-pending-signup");
            localStorage.removeItem("ditto-pending-team");
            navigate(`/party/${pendingTeam}`);
          }
        } else {
          // User A: poll signup-status
          const res = await fetch(`${API}/api/bubl/signup-status/${signupCode}`);
          const data = await res.json();
          if (data.status === "ready" && data.team_code) {
            clearInterval(interval);
            localStorage.setItem("ditto-team-code", data.team_code);
            localStorage.removeItem("ditto-pending-signup");
            navigate(`/party/${data.team_code}`);
          }
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, signupCode, navigate]);

  const totalSteps = 5;

  return (
    <div className="min-h-screen text-[#ede9fe]" style={{ ...px, background: "#111827" }}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: "#111827" }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b-4 border-[#ec4899] bg-[#1c2444]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="leading-none flex items-baseline gap-1.5" style={{ textDecoration: "none" }}>
            <span className="text-white text-[18px] font-normal" style={{ fontFamily: "'Rubik Glitch', system-ui" }}>dtd</span>
          </a>
          <span className="text-[#64748b] text-[7px]">STEP {step + 1}/{totalSteps}</span>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="fixed top-14 left-0 right-0 z-50 h-1 bg-[#1c2444]">
        <div className="h-full bg-[#ec4899] transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 pt-24 pb-16">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>

          {/* ═══ Step 0: Basics ═══ */}
          {step === 0 && (
            <div>
              <h1 className="text-[14px] sm:text-[16px] text-white mb-1">THE BASICS</h1>
              <p className="text-[#64748b] text-[8px] mb-6">let's get to know you</p>
              <div className="space-y-5">
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">FIRST NAME *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className={inputClass} style={px} placeholder="first name only" />
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">AGE *</label>
                  <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    className={inputClass} style={px} placeholder="18" inputMode="numeric" />
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">SCHOOL EMAIL *</label>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    className={inputClass} style={px} placeholder="you@ucr.edu" inputMode="email" />
                  <p className="text-[#64748b] text-[6px] mt-1">.edu email to verify you're a student</p>
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">GENDER *</label>
                  <div className="flex gap-2 flex-wrap">
                    {GENDER_OPTIONS.map(g => (
                      <button key={g} onClick={() => setGender(g)}
                        className="px-3 py-2 border-4 text-[9px] active:translate-y-[1px] transition-none"
                        style={{
                          borderColor: gender === g ? "#ec4899" : "#6366f144",
                          background: gender === g ? "#ec4899" : "transparent",
                          color: gender === g ? "#111827" : "#6366f1",
                          boxShadow: gender === g ? "3px 3px 0 #9d174d" : "none",
                        }}>
                        {g.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Step 1: About You ═══ */}
          {step === 1 && (
            <div>
              <h1 className="text-[14px] sm:text-[16px] text-white mb-1">ABOUT YOU</h1>
              <p className="text-[#64748b] text-[8px] mb-6">helps us match better</p>
              <div className="space-y-5">
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">ETHNICITY <span className="text-[#64748b]">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {ETHNICITY_OPTIONS.map(e => (
                      <button key={e} onClick={() => toggleEthnicity(e)}
                        className="px-2 py-1.5 border-3 text-[8px] active:translate-y-[1px] transition-none"
                        style={{
                          border: `3px solid ${ethnicity.includes(e) ? "#6366f1" : "#6366f133"}`,
                          background: ethnicity.includes(e) ? "#6366f1" : "transparent",
                          color: ethnicity.includes(e) ? "#111827" : "#6366f1",
                        }}>
                        {e.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">HEIGHT</label>
                  <div className="flex gap-2 items-center">
                    <input value={heightFt} onChange={e => setHeightFt(e.target.value.replace(/\D/g, "").slice(0, 1))}
                      className={`${inputClass} w-20 text-center`} style={px} placeholder="ft" inputMode="numeric" />
                    <span className="text-[#64748b] text-[10px]">'</span>
                    <input value={heightIn} onChange={e => setHeightIn(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      className={`${inputClass} w-20 text-center`} style={px} placeholder="in" inputMode="numeric" />
                    <span className="text-[#64748b] text-[10px]">"</span>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">YEAR</label>
                  <div className="flex flex-wrap gap-2">
                    {YEAR_OPTIONS.map(y => (
                      <button key={y} onClick={() => setYear(y)}
                        className="px-2 py-1.5 border-3 text-[8px] active:translate-y-[1px] transition-none"
                        style={{
                          border: `3px solid ${year === y ? "#ffec27" : "#ffec2733"}`,
                          background: year === y ? "#ffec27" : "transparent",
                          color: year === y ? "#111827" : "#ffec27",
                        }}>
                        {y.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">BIO <span className="text-[#64748b]">(one-liner about you)</span></label>
                  <input value={bio} onChange={e => setBio(e.target.value)}
                    className={inputClass} style={px} placeholder="i like sunsets and ramen" />
                </div>
              </div>
            </div>
          )}

          {/* ═══ Step 2: Preferences ═══ */}
          {step === 2 && (
            <div>
              <h1 className="text-[14px] sm:text-[16px] text-white mb-1">YOUR TYPE</h1>
              <p className="text-[#64748b] text-[8px] mb-6">who are you looking for?</p>
              <div className="space-y-6">
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-3 block">I WANT TO DATE *</label>
                  <div className="flex flex-wrap gap-2">
                    {DATE_WHO_OPTIONS.map(d => (
                      <button key={d} onClick={() => setDateWho(d)}
                        className="px-4 py-2.5 border-4 text-[10px] active:translate-y-[1px] transition-none"
                        style={{
                          borderColor: dateWho === d ? "#ec4899" : "#ec489944",
                          background: dateWho === d ? "#ec4899" : "transparent",
                          color: dateWho === d ? "#111827" : "#ec4899",
                          boxShadow: dateWho === d ? "3px 3px 0 #9d174d" : "none",
                        }}>
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-3 block">LOOKING FOR *</label>
                  <div className="flex flex-col gap-2">
                    {LOOKING_FOR_OPTIONS.map(l => (
                      <button key={l} onClick={() => setLookingFor(l)}
                        className="w-full px-4 py-3 border-4 text-[9px] text-left active:translate-y-[1px] transition-none"
                        style={{
                          borderColor: lookingFor === l ? "#6366f1" : "#6366f133",
                          background: lookingFor === l ? "#6366f1" : "transparent",
                          color: lookingFor === l ? "#111827" : "#6366f1",
                          boxShadow: lookingFor === l ? "3px 3px 0 #3730a3" : "none",
                        }}>
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Step 3: Final — DM Ditto ═══ */}
          {step === 3 && (
            <div>
              <h1 className="text-[14px] sm:text-[16px] text-white mb-1">REVIEW</h1>
              <p className="text-[#64748b] text-[8px] mb-6">make sure everything looks good</p>

              <div className="space-y-5">
                <div>
                  <label className="text-[8px] text-[#6366f1] mb-2 block">HOW DID YOU HEAR ABOUT US?</label>
                  <div className="flex flex-wrap gap-2">
                    {HEARD_FROM_OPTIONS.map(h => (
                      <button key={h} onClick={() => setHeardFrom(h)}
                        className="px-2 py-1.5 border-3 text-[8px] active:translate-y-[1px] transition-none"
                        style={{
                          border: `3px solid ${heardFrom === h ? "#6366f1" : "#6366f133"}`,
                          background: heardFrom === h ? "#6366f1" : "transparent",
                          color: heardFrom === h ? "#111827" : "#6366f1",
                        }}>
                        {h.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border-4 border-[#6366f1]/20 bg-[#1c2444] p-4 space-y-2">
                  <p className="text-[8px] text-[#64748b] mb-3">YOUR APPLICATION</p>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-[#64748b]">Name</span>
                    <span className="text-white">{name || "—"}</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-[#64748b]">Age</span>
                    <span className="text-white">{age || "—"}</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-[#64748b]">Gender</span>
                    <span className="text-white">{gender || "—"}</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-[#64748b]">Looking for</span>
                    <span className="text-white">{lookingFor || "—"}</span>
                  </div>
                </div>
              </div>

              {error && <p className="text-[#f87171] text-[9px] text-center mt-3">{error}</p>}
            </div>
          )}

          {/* ═══ Step 4: Done ═══ */}
          {step === 4 && (
            <div className="text-center">
              <div className="mb-6 relative">
                <span className="text-[60px] sm:text-[80px] animate-bounce-subtle inline-block">{isUserB ? "🎉" : "🎮"}</span>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full opacity-20 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${isUserB ? "#00e436" : "#ec4899"}, transparent 70%)` }} />
              </div>

              {(() => {
                const doneContent = (
                  <>
                    <h1 className="text-[16px] sm:text-[20px] text-white mb-2" style={{ fontFamily: "'Rubik Glitch', system-ui" }}>almost there, {name.split(" ")[0] || "player"}</h1>
                    <p className="text-[#64748b] text-[8px] mb-6">one more thing to finish</p>

                    <div className="border-4 border-[#ec4899]/30 bg-[#1c2444] p-5 mb-6">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-3 h-3 bg-[#ffec27] animate-pulse" />
                        <span className="text-[#ffec27] text-[9px]">1 STEP LEFT</span>
                        <div className="w-3 h-3 bg-[#ffec27] animate-pulse" />
                      </div>
                      <p className="text-[#cbd5e1] text-[11px] leading-[2.2]">
                        tap the button below to DM <span className="text-[#ec4899] font-bold">@ditto.test</span>
                      </p>
                      <p className="text-[#64748b] text-[8px] mt-2">
                        just say hey — ditto will handle the rest
                      </p>
                    </div>

                    <button
                      onClick={() => { window.location.href = `https://ig.me/m/ditto.test?ref=signup_${signupCode}`; }}
                      className="w-full py-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 active:scale-[0.98] transition-transform"
                      style={{ borderRadius: "50px", border: "none", cursor: "pointer" }}>
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                        <defs>
                          <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                            <stop offset="0%" stopColor="#fdf497"/>
                            <stop offset="5%" stopColor="#fdf497"/>
                            <stop offset="45%" stopColor="#fd5949"/>
                            <stop offset="60%" stopColor="#d6249f"/>
                            <stop offset="90%" stopColor="#285AEB"/>
                          </radialGradient>
                        </defs>
                        <rect width="28" height="28" rx="7" fill="url(#ig-grad)" />
                        <rect x="5.5" y="5.5" width="17" height="17" rx="5" stroke="white" strokeWidth="2" fill="none"/>
                        <circle cx="14" cy="14" r="4" stroke="white" strokeWidth="2" fill="none"/>
                        <circle cx="19.5" cy="8.5" r="1.5" fill="white"/>
                      </svg>
                      <span className="text-[#111827] text-[14px]" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
                        Open @ditto.test
                      </span>
                    </button>
                  </>
                );
                return doneContent;
              })()}
            </div>
          )}

        </motion.div>

        {/* ─── Navigation buttons ─── */}
        {step <= 3 && (
          <div className="flex gap-3 mt-8">
            <button onClick={() => step === 0 ? window.location.href = "/" : setStep(step - 1)}
              className="px-5 py-3 border-4 border-[#6366f1]/40 text-[#6366f1] text-[9px] hover:border-[#6366f1] active:translate-y-[1px] transition-none">
              BACK
            </button>
            <button
              onClick={() => step === 3 ? submit() : setStep(step + 1)}
              disabled={step === 3 ? submitting : !canNext()}
              className="flex-1 py-3 border-4 border-[#ec4899] bg-[#ec4899] text-[#111827] text-[9px] sm:text-[10px] hover:bg-white hover:border-white active:translate-x-[1px] active:translate-y-[1px] transition-none disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ boxShadow: "4px 4px 0 #9d174d" }}>
              {step === 3 ? (submitting ? "SUBMITTING..." : "NEXT >>") : step === 2 ? "REVIEW" : "NEXT >>"}
            </button>
          </div>
        )}

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="w-2 h-2 transition-colors" style={{
              background: i === step ? "#ec4899" : i < step ? "#6366f1" : "#6366f133",
            }} />
          ))}
        </div>

        {step === 4 && (
          <button onClick={() => setStep(3)}
            className="w-full mt-4 py-2 text-[#64748b] text-[8px] hover:text-[#ffec27] transition-none">
            [ BACK ]
          </button>
        )}
      </div>
    </div>
  );
}
