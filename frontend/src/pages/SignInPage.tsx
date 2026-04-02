import { useState } from "react";
import { useNavigate } from "react-router-dom";

const px = { fontFamily: "'Press Start 2P', monospace" } as const;

type Step = "phone" | "texted" | "code" | "done";

export function SignInPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(() => {
    const saved = sessionStorage.getItem("x2-signin");
    return saved ? JSON.parse(saved).step || "phone" : "phone";
  });
  const [phone, setPhone] = useState(() => {
    const saved = sessionStorage.getItem("x2-signin");
    return saved ? JSON.parse(saved).phone || "" : "";
  });

  const goToStep = (s: Step, p?: string) => {
    setStep(s);
    sessionStorage.setItem("x2-signin", JSON.stringify({ step: s, phone: p || phone }));
  };
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const checkPhone = async () => {
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("enter a valid phone number"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/blind-date/status/${digits}`);
      await res.json();
      if (!res.ok) { setError("no account found with this number"); setLoading(false); return; }
      goToStep("texted");
    } catch {
      setError("connection failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (otp.length < 4) { setError("enter the 4-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/blind-date/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ""), code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "invalid code"); setLoading(false); return; }
      sessionStorage.setItem("x2-user", JSON.stringify(data.user));
      sessionStorage.removeItem("x2-signin");
      navigate("/party");
    } catch {
      setError("connection failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 sm:px-4 py-3 border-4 border-[#7C3AED] bg-[#12081F] text-white text-[11px] placeholder:text-[#7C3AED]/40 focus:outline-none focus:border-[#FACC15] text-center tracking-[0.2em] min-h-[44px]";

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={px}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src="/bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(12px)", imageRendering: "pixelated", transform: "scale(1.05)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(11,0,20,0.88) 0%, rgba(13,6,41,0.85) 40%, rgba(11,0,20,0.9) 100%)" }} />
      </div>
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="w-full z-50">
          <div className="px-8 h-14 sm:h-16 flex items-center justify-between">
            <a href="/" className="leading-none flex items-baseline gap-1.5" style={{ textDecoration: "none" }}>
              <span style={{ fontFamily: "'Bitter Sour', cursive" }}>
                <span style={{ color: "#FACC15", fontSize: "20px" }}>x</span>
                <span style={{ color: "#FACC15", fontSize: "28px" }}>2</span>
              </span>
              <span className="text-[#A5B4C8] text-[7px]" style={px}>by Ditto</span>
            </a>
            <span className="text-[#FACC15] text-[7px] sm:text-[9px]">&lt; SIGN IN &gt;</span>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-5 py-8 sm:py-12">
          <div className="w-full max-w-sm p-5 sm:p-10"
            style={{ border: "4px solid #7C3AED", background: "#12081F", boxShadow: "4px 4px 0 #4C1D95" }}>

            {/* Step 1: Enter phone */}
            {step === "phone" && (
              <div>
                <p className="text-[#C084FC] text-[8px] sm:text-[10px] mb-2 sm:mb-3 text-center">&lt; WELCOME BACK &gt;</p>
                <h2 className="text-[14px] sm:text-[22px] text-center mb-2 sm:mb-3 text-[#E8DEF8]">Sign in</h2>
                <p className="text-[#A5B4C8] text-[7px] sm:text-[8px] text-center mb-6 sm:mb-8 leading-[2]">
                  Enter your phone number to get started
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <input type="tel" value={phone} onChange={(e) => setPhone(fmt(e.target.value))}
                    placeholder="(000) 000-0000" className={inputClass} style={px} autoFocus />
                  {error && <p className="text-[8px] sm:text-[9px] text-[#F87171] text-center">! {error}</p>}
                  <button onClick={checkPhone} disabled={loading}
                    className="w-full py-3 sm:py-4 min-h-[44px] text-[10px] sm:text-[12px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                    style={{ border: "4px solid #FACC15", background: "#FACC15", color: "#12081F", boxShadow: "4px 4px 0 #A16207" }}>
                    {loading ? "CHECKING..." : "> NEXT"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Text x2 */}
            {step === "texted" && (
              <div className="text-center">
                <p className="text-[#C084FC] text-[8px] sm:text-[10px] mb-3">&lt; VERIFY &gt;</p>
                <h2 className="text-[14px] sm:text-[22px] text-center mb-3 text-[#E8DEF8]">DM @x2byditto</h2>
                <p className="text-[#A5B4C8] text-[7px] sm:text-[8px] text-center mb-2 leading-[2]">
                  DM @x2byditto "sign in" to get your code
                </p>
                <p className="text-[#7C3AED] text-[8px] sm:text-[10px] text-center mb-6">{phone}</p>

                <a href="https://ig.me/m/x2byditto"
                  onClick={() => goToStep("code")}
                  className="inline-block w-full py-3 sm:py-4 min-h-[44px] text-[10px] sm:text-[12px] text-center active:translate-x-[2px] active:translate-y-[2px]"
                  style={{ border: "4px solid #8B5CF6", background: "#8B5CF6", color: "#fff", boxShadow: "4px 4px 0 #4C1D95" }}>
                  &gt; DM @x2byditto
                </a>

                <p className="text-[#6B7280] text-[6px] sm:text-[7px] text-center mt-4"
                  style={{ animation: "blink-pixel 1.5s step-end infinite" }}>
                  x2 will reply with a 4-digit code...
                </p>
              </div>
            )}

            {/* Step 3: Enter code */}
            {step === "code" && (
              <div>
                <p className="text-[#C084FC] text-[8px] sm:text-[10px] mb-2 sm:mb-3 text-center">&lt; VERIFY &gt;</p>
                <h2 className="text-[14px] sm:text-[22px] text-center mb-2 sm:mb-3 text-[#E8DEF8]">Enter code</h2>
                <p className="text-[#A5B4C8] text-[7px] sm:text-[8px] text-center mb-2 leading-[2]">
                  Enter the code x2 DM'd you
                </p>
                <p className="text-[#7C3AED] text-[8px] sm:text-[10px] text-center mb-6 sm:mb-8">{phone}</p>
                <div className="space-y-3 sm:space-y-4">
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="____" maxLength={4} className={inputClass}
                    style={{ ...px, fontSize: "20px", letterSpacing: "0.4em" }} autoFocus />
                  {error && <p className="text-[8px] sm:text-[9px] text-[#F87171] text-center">! {error}</p>}
                  <button onClick={verifyOtp} disabled={loading}
                    className="w-full py-3 sm:py-4 min-h-[44px] text-[10px] sm:text-[12px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                    style={{ border: "4px solid #8B5CF6", background: "#8B5CF6", color: "#fff", boxShadow: "4px 4px 0 #4C1D95" }}>
                    {loading ? "VERIFYING..." : "> VERIFY"}
                  </button>
                  <button onClick={() => goToStep("texted")}
                    className="w-full py-3 min-h-[44px] text-[8px] sm:text-[9px] text-[#7C3AED]">
                    resend code
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {step === "done" && (
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 flex items-center justify-center text-[20px] sm:text-[24px]"
                  style={{ border: "4px solid #34D399", background: "#12081F" }}>
                  <span className="text-[#34D399]">&#x2714;</span>
                </div>
                <h2 className="text-[14px] sm:text-[18px] text-[#34D399] mb-3 sm:mb-4">SIGNED IN!</h2>
                <p className="text-[#A5B4C8] text-[8px] sm:text-[9px] leading-[2.2] mb-4 sm:mb-6">welcome back to x2</p>
                <button onClick={() => navigate("/")}
                  className="px-6 sm:px-8 py-3 text-[9px] sm:text-[11px] min-h-[44px] active:translate-x-[2px] active:translate-y-[2px]"
                  style={{ border: "4px solid #7C3AED", background: "#7C3AED", color: "#fff", boxShadow: "4px 4px 0 #4C1D95" }}>
                  CONTINUE &gt;&gt;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
