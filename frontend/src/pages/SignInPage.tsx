import { useState } from "react";
import { useNavigate } from "react-router-dom";

const px = { fontFamily: "'Press Start 2P', monospace" } as const;
const display = { fontFamily: "'Rubik Glitch', system-ui" };

const API = import.meta.env.VITE_API_URL || "";

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/bubl/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "no account found");
        setLoading(false);
        return;
      }
      if (data.team_code) {
        localStorage.setItem("ditto-team-code", data.team_code);
        navigate(`/party/${data.team_code}`);
      } else {
        // User exists but no team yet
        setError("you're signed up but not in a team yet — DM @ditto.test to get started");
      }
    } catch {
      setError("connection failed — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={px}>
      <div className="fixed inset-0 z-0" style={{ background: "#111827" }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="w-full z-50 border-b-4 border-[#6366f1]/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <a href="/" className="leading-none" style={{ textDecoration: "none" }}>
              <span className="text-white text-[18px]" style={display}>dtd</span>
            </a>
            <span className="text-[#6366f1] text-[7px] sm:text-[9px]">&lt; SIGN IN &gt;</span>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-5 py-8 sm:py-12">
          <div className="w-full max-w-sm p-6 sm:p-10"
            style={{ border: "4px solid #6366f1", background: "#1c2444", boxShadow: "4px 4px 0 #3730a3" }}>
            <p className="text-[#ec4899] text-[8px] sm:text-[10px] mb-2 text-center">&lt; WELCOME BACK &gt;</p>
            <h2 className="text-[16px] sm:text-[22px] text-center mb-2 text-white" style={display}>sign in</h2>
            <p className="text-[#64748b] text-[7px] sm:text-[8px] text-center mb-6 leading-[2]">
              enter the email you signed up with
            </p>

            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.edu"
                className="w-full px-4 py-3 border-4 border-[#6366f1] bg-[#111827] text-white text-[11px] placeholder:text-[#6366f1]/40 focus:outline-none focus:border-[#ffec27] text-center min-h-[48px]"
                style={px}
                autoFocus
                onKeyDown={e => e.key === "Enter" && submit()}
              />

              {error && (
                <p className="text-[8px] text-[#f87171] text-center leading-[2]">{error}</p>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="w-full py-3 min-h-[48px] text-[10px] sm:text-[12px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
                style={{ border: "4px solid #ec4899", background: "#ec4899", color: "#111827", boxShadow: "4px 4px 0 #9d174d" }}>
                {loading ? "LOOKING YOU UP..." : "> FIND MY LOBBY"}
              </button>

              <div className="text-center pt-2">
                <p className="text-[#64748b] text-[7px]">don't have an account?</p>
                <button onClick={() => navigate("/signup")} className="text-[#ec4899] text-[8px] mt-1 hover:text-[#ffec27]">
                  sign up →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
