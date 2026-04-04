import { useState, useRef } from "react";
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
  const [step, setStep] = useState(0);

  // basics
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

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
  const [signupCode, setSignupCode] = useState("");

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
    if (step === 0) return name.trim() && age && gender;
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
      fd.append("ethnicity", JSON.stringify(ethnicity));
      fd.append("height", heightFt && heightIn ? `${heightFt}'${heightIn}"` : "");
      fd.append("year", year);
      fd.append("bio", bio.trim());
      fd.append("looking_for", lookingFor);
      fd.append("date_who", dateWho);
      fd.append("heard_from", heardFrom);

      await fetch(`${API}/api/bubl/profile`, { method: "POST", body: fd }).catch(() => {});
    } catch {
      // Non-blocking
    }

    // Save pending signup to localStorage so the front page knows
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
                  <label className="text-[8px] text-[#ec4899] mb-2 block">NAME *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className={inputClass} style={px} placeholder="first name" />
                </div>
                <div>
                  <label className="text-[8px] text-[#ec4899] mb-2 block">AGE *</label>
                  <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    className={inputClass} style={px} placeholder="18" inputMode="numeric" />
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
                  <label className="text-[8px] text-[#ec4899] mb-2 block">ETHNICITY <span className="text-[#64748b]">(select all)</span></label>
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
              <h1 className="text-[14px] sm:text-[16px] text-white mb-1">ALMOST DONE</h1>
              <p className="text-[#64748b] text-[8px] mb-6">one last thing</p>

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

                <p className="text-[#cbd5e1] text-[8px] sm:text-[9px] leading-[2] text-center">
                  hit the button below to submit your application and DM @ditto_ucr on instagram to complete your signup
                </p>
              </div>

              {/* Submit + DM Ditto button */}
              <button onClick={submit} disabled={submitting}
                className="w-full mt-6 py-4 border-4 border-white bg-white text-[#111827] text-[10px] sm:text-[12px] hover:bg-gray-100 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-3"
                style={{ borderRadius: "50px" }}>
                {/* Instagram icon */}
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                  <rect width="28" height="28" rx="6" fill="#E1306C" />
                  <path d="M14 8.87c-2.8 0-5.13 2.3-5.13 5.13S11.2 19.13 14 19.13 19.13 16.83 19.13 14 16.8 8.87 14 8.87zm0 8.47a3.34 3.34 0 110-6.68 3.34 3.34 0 010 6.68zm5.34-8.68a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zM21.94 10.06a5.26 5.26 0 00-1.32-1.87 5.26 5.26 0 00-1.87-1.32A6.6 6.6 0 0016.56 6.5c-.87-.04-1.14-.05-3.36-.05h-.4c-2.22 0-2.49.01-3.36.05a6.6 6.6 0 00-2.19.37 5.26 5.26 0 00-1.87 1.32A5.26 5.26 0 004.06 10.06a6.6 6.6 0 00-.37 2.19c-.04.87-.05 1.14-.05 3.36v.4c0 2.22.01 2.49.05 3.36.02.76.17 1.28.37 2.19a5.26 5.26 0 001.32 1.87 5.26 5.26 0 001.87 1.32c.57.2 1.07.35 2.19.37.87.04 1.14.05 3.36.05h.4c2.22 0 2.49-.01 3.36-.05a6.6 6.6 0 002.19-.37 5.26 5.26 0 001.87-1.32 5.26 5.26 0 001.32-1.87c.2-.57.35-1.07.37-2.19.04-.87.05-1.14.05-3.36v-.4c0-2.22-.01-2.49-.05-3.36a6.6 6.6 0 00-.37-2.19z" fill="white"/>
                </svg>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
                  {submitting ? "Submitting..." : "DM @ditto_ucr to Complete"}
                </span>
              </button>

              {error && <p className="text-[#f87171] text-[9px] text-center mt-3">{error}</p>}
            </div>
          )}

          {/* ═══ Step 4: Done — DM your code ═══ */}
          {step === 4 && (
            <div className="text-center">
              <h1 className="text-[14px] sm:text-[16px] text-white mb-1">YOU'RE ALMOST IN</h1>
              <p className="text-[#64748b] text-[8px] mb-8">one last step to complete signup</p>

              <div className="border-4 border-[#ffec27] bg-[#1c2444] p-6 mb-6">
                <p className="text-[#64748b] text-[7px] mb-2">YOUR SIGNUP CODE</p>
                <p className="text-[32px] sm:text-[40px] tracking-[0.3em] text-[#ffec27] select-all mb-3">{signupCode}</p>
                <button onClick={() => { navigator.clipboard.writeText(signupCode); }}
                  className="text-[#64748b] text-[8px] hover:text-[#ffec27] transition-none">
                  [ TAP TO COPY ]
                </button>
              </div>

              <p className="text-[#cbd5e1] text-[9px] leading-[2.2] mb-6">
                DM <span className="text-[#ec4899]">@ditto_ucr</span> on instagram<br />
                and send your code to finish signing up
              </p>

              <a href={`https://ig.me/m/ditto_ucr?ref=signup_${signupCode}`} target="_blank" rel="noopener noreferrer"
                className="w-full py-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 active:scale-[0.98] transition-transform"
                style={{ borderRadius: "50px", textDecoration: "none" }}>
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
                  <rect width="28" height="28" rx="6" fill="#E1306C" />
                  <path d="M14 8.87c-2.8 0-5.13 2.3-5.13 5.13S11.2 19.13 14 19.13 19.13 16.83 19.13 14 16.8 8.87 14 8.87zm0 8.47a3.34 3.34 0 110-6.68 3.34 3.34 0 010 6.68zm5.34-8.68a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zM21.94 10.06a5.26 5.26 0 00-1.32-1.87 5.26 5.26 0 00-1.87-1.32A6.6 6.6 0 0016.56 6.5c-.87-.04-1.14-.05-3.36-.05h-.4c-2.22 0-2.49.01-3.36.05a6.6 6.6 0 00-2.19.37 5.26 5.26 0 00-1.87 1.32A5.26 5.26 0 004.06 10.06a6.6 6.6 0 00-.37 2.19c-.04.87-.05 1.14-.05 3.36v.4c0 2.22.01 2.49.05 3.36.02.76.17 1.28.37 2.19a5.26 5.26 0 001.32 1.87 5.26 5.26 0 001.87 1.32c.57.2 1.07.35 2.19.37.87.04 1.14.05 3.36.05h.4c2.22 0 2.49-.01 3.36-.05a6.6 6.6 0 002.19-.37 5.26 5.26 0 001.87-1.32 5.26 5.26 0 001.32-1.87c.2-.57.35-1.07.37-2.19.04-.87.05-1.14.05-3.36v-.4c0-2.22-.01-2.49-.05-3.36a6.6 6.6 0 00-.37-2.19z" fill="white"/>
                </svg>
                <span className="text-[#111827] text-[14px]" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
                  Open @ditto_ucr
                </span>
              </a>
            </div>
          )}

        </motion.div>

        {/* ─── Navigation buttons ─── */}
        {step < 3 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="px-5 py-3 border-4 border-[#6366f1]/40 text-[#6366f1] text-[9px] hover:border-[#6366f1] active:translate-y-[1px] transition-none">
                BACK
              </button>
            )}
            <button onClick={() => setStep(step + 1)} disabled={!canNext()}
              className="flex-1 py-3 border-4 border-[#ec4899] bg-[#ec4899] text-[#111827] text-[9px] sm:text-[10px] hover:bg-white hover:border-white active:translate-x-[1px] active:translate-y-[1px] transition-none disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ boxShadow: "4px 4px 0 #9d174d" }}>
              {step === 2 ? "REVIEW" : "NEXT >>"}
            </button>
          </div>
        )}
        {step === 3 && (
          <button onClick={() => setStep(2)}
            className="w-full mt-3 py-2 text-[#64748b] text-[8px] hover:text-[#ffec27] transition-none">
            [ BACK ]
          </button>
        )}

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="w-2 h-2 transition-colors" style={{
              background: i === step ? "#ec4899" : i < step ? "#6366f1" : "#6366f133",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
