import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const px = { fontFamily: "'Press Start 2P', monospace" };
const display = { fontFamily: "'Rubik Glitch', system-ui" };
const serif = { fontFamily: "'Spencer', serif" };

export function JoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  // Save the duo code so the signup form knows this is a referral
  useEffect(() => {
    if (code) {
      localStorage.setItem("ditto-duo-code", code);
    }
  }, [code]);

  const openDitto = () => {
    setRedirecting(true);
    // Open IG DM with referral ref — ditto will know User B was invited by User A
    window.location.href = `https://ig.me/m/ditto_ucr?ref=join_${code}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ ...px, background: "#111827" }}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: "#111827" }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)" }} />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <h1 className="text-[40px] sm:text-[56px] leading-none text-[#ec4899] mb-4" style={display}>
          double the date
        </h1>

        <p className="text-[#cbd5e1] text-[18px] sm:text-[24px] mb-2" style={serif}>
          you've been invited
        </p>
        <p className="text-[#64748b] text-[8px] sm:text-[9px] mb-8">
          your friend wants you to be their duo partner
        </p>

        {/* Invite card */}
        <div className="border-4 border-[#6366f1] bg-[#1c2444] p-6 mb-6"
          style={{ boxShadow: "4px 4px 0 #6366f1, -4px -4px 0 #6366f1, 4px -4px 0 #6366f1, -4px 4px 0 #6366f1" }}>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-[50px] aspect-square border-4 border-[#6366f1] bg-[#111827] flex items-center justify-center"
                style={{ boxShadow: "2px 2px 0 #3730a3" }}>
                <span className="text-[18px]">🧑</span>
              </div>
              <span className="text-[5px] text-[#6366f1]">YOUR FRIEND</span>
              <div className="px-1.5 py-0.5 text-[4px] uppercase bg-[#6366f1] text-[#111827]">ready</div>
            </div>
            <span className="text-[#ffec27] text-[10px]">+</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-[50px] aspect-square border-4 border-dashed border-[#ec4899] bg-[#111827] flex items-center justify-center"
                style={{ animation: "arcade-glow 2s ease-in-out infinite" }}>
                <span className="text-[14px] text-[#ec4899]">▶</span>
              </div>
              <span className="text-[5px] text-[#ec4899]">YOU</span>
              <div className="px-1.5 py-0.5 text-[4px] uppercase bg-[#ec4899] text-[#111827]">join</div>
            </div>
          </div>

          <p className="text-[#cbd5e1] text-[8px] leading-[2]">
            join your friend's duo and get<br />matched with another pair this wednesday
          </p>
        </div>

        {/* CTA — opens IG DM with referral */}
        <button onClick={openDitto} disabled={redirecting}
          className="w-full py-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{ borderRadius: "50px" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
            <defs>
              <radialGradient id="ig-grad-join" cx="30%" cy="107%" r="150%">
                <stop offset="0%" stopColor="#fdf497"/>
                <stop offset="5%" stopColor="#fdf497"/>
                <stop offset="45%" stopColor="#fd5949"/>
                <stop offset="60%" stopColor="#d6249f"/>
                <stop offset="90%" stopColor="#285AEB"/>
              </radialGradient>
            </defs>
            <rect width="28" height="28" rx="7" fill="url(#ig-grad-join)" />
            <rect x="5.5" y="5.5" width="17" height="17" rx="5" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="14" cy="14" r="4" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="19.5" cy="8.5" r="1.5" fill="white"/>
          </svg>
          <span className="text-[#111827] text-[14px]" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
            {redirecting ? "Opening..." : "DM @ditto_ucr to Join"}
          </span>
        </button>

        <p className="text-[#64748b] text-[7px] mt-4">
          ditto will send you the signup form
        </p>

        {/* Fallback — go straight to form */}
        <button onClick={() => navigate(`/signup?duo=${code}`)}
          className="mt-6 text-[#6366f1] text-[8px] hover:text-[#ffec27] transition-none">
          [ or fill out the form directly ]
        </button>

        <p className="text-[#64748b] text-[7px] mt-8">
          2v2 double dates every wednesday
        </p>
      </div>
    </div>
  );
}
