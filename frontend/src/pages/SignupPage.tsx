import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

const px = { fontFamily: "'Press Start 2P', monospace" };

export function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const submit = async () => {
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("fill in name and phone"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("phone", phone.replace(/\D/g, ""));
    fd.append("age", age);
    fd.append("gender", gender);
    fd.append("looking_for", lookingFor);
    fd.append("school", school.trim());
    fd.append("bio", bio.trim());
    fd.append("instagram_username", instagram.trim());

    try {
      const res = await fetch("/api/bubl/profile", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "something went wrong"); setSubmitting(false); return; }
      window.location.href = "https://ig.me/m/x2byditto";
      return;
    } catch {
      setError("couldn't connect — try again");
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border-4 border-[#FACC15] bg-[#12081F] text-white text-[11px] px-3 py-3 placeholder-white/40 focus:outline-none focus:border-[#FDE68A]";

  return (
    <div className="min-h-screen text-[#E8DEF8]" style={{ ...px, background: "#0B0014" }}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src="/bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(12px)", imageRendering: "pixelated", transform: "scale(1.05)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(11,0,20,0.85) 0%, rgba(13,6,41,0.8) 40%, rgba(11,0,20,0.88) 100%)" }} />
      </div>

      <nav className="fixed top-0 w-full z-50">
        <div className="px-8 h-14 flex items-center">
          <a href="/" className="leading-none flex items-baseline gap-1.5" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Bitter Sour', cursive" }}>
              <span className="text-[#FACC15] text-[20px]">x</span>
              <span className="text-[#FACC15] text-[28px]">2</span>
            </span>
            <span className="text-[#A5B4C8] text-[7px]" style={px}>by Ditto</span>
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-24 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-[16px] text-[#E8DEF8] leading-relaxed">LET'S SET<br />YOU UP</h1>
            <p className="text-[#A5B4C8] text-[9px] mt-2 mb-8">TAKES 30 SECONDS</p>

            <div className="space-y-5">
              <div>
                <label className="text-[9px] text-[#FACC15] mb-2 block">NAME</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className={inputClass} style={px} placeholder="FIRST NAME" />
              </div>
              <div>
                <label className="text-[9px] text-[#FACC15] mb-2 block">PHONE</label>
                <input value={phone} onChange={e => setPhone(fmtPhone(e.target.value))}
                  className={inputClass} style={px} placeholder="(000) 000-0000" inputMode="tel" />
              </div>
              {/* Other fields hidden for MVP */}
            </div>

            <button onClick={submit} disabled={submitting}
              className="w-full mt-6 py-3.5 border-4 border-[#FACC15] bg-[#FACC15] text-[#12081F] text-[11px] hover:bg-[#FDE68A] transition disabled:opacity-50"
              style={{ ...px, boxShadow: "4px 4px 0 #A16207" }}>
              {submitting ? "SUBMITTING..." : "SIGN UP >>"}
            </button>
            {error && <p className="text-[#F87171] text-[9px] text-center mt-3">{error}</p>}
          </motion.div>
      </div>
    </div>
  );
}
