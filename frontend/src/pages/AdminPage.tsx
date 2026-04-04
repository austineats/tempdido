import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "";

type Stats = { totalProfiles: number; totalTeams: number; fullTeams: number; totalMessages: number; recentMessages: number };
type Profile = { id: string; name: string; email?: string; phone?: string; ig_id?: string; gender?: string; school?: string; created_at: string };
type Team = { id: string; code: string; player1_name: string; player1_ig_id?: string; player1_ready: boolean; player2_name?: string; player2_ig_id?: string; player2_ready: boolean; status: string; created_at: string };
type Message = { id: string; phone: string; ig_id?: string; role: string; content: string; created_at: string };
type Conversation = { userId: string; messages: Message[]; lastActivity: string };

function apiFetch(path: string, token: string) {
  return fetch(`${API}/api/admin${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h ago</span>;
  return <span>{Math.floor(hrs / 24)}d ago</span>;
}

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin-token") || "");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(!!token);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<"overview" | "users" | "teams" | "chats">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [convoMessages, setConvoMessages] = useState<Message[]>([]);

  const login = async () => {
    setError("");
    try {
      const res = await apiFetch("/stats", password);
      if (!res.ok) { setError("wrong password"); return; }
      setToken(password);
      sessionStorage.setItem("admin-token", password);
      setAuthed(true);
      setStats(res.stats);
    } catch { setError("connection failed"); }
  };

  useEffect(() => {
    if (!authed) return;
    apiFetch("/stats", token).then(r => { if (r.ok) setStats(r.stats); else setAuthed(false); });
  }, [authed, token]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "users") apiFetch("/profiles", token).then(r => r.ok && setProfiles(r.profiles));
    if (tab === "teams") apiFetch("/teams", token).then(r => r.ok && setTeams(r.teams));
    if (tab === "chats") apiFetch("/chats", token).then(r => r.ok && setConvos(r.conversations));
  }, [tab, authed, token]);

  useEffect(() => {
    if (!selectedConvo || !authed) return;
    apiFetch(`/chat/${selectedConvo}`, token).then(r => r.ok && setConvoMessages(r.messages));
  }, [selectedConvo, authed, token]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="w-full max-w-xs bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <h1 className="text-white text-lg font-semibold mb-1">admin</h1>
          <p className="text-[#64748b] text-xs mb-4">doubles by ditto</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="password" autoFocus
            className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#6366f1] mb-3" />
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <button onClick={login}
            className="w-full py-2 bg-[#6366f1] text-white text-sm rounded hover:bg-[#4f46e5] transition-colors">
            log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-[#1e293b] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold">ditto admin</h1>
          <div className="flex gap-1">
            {(["overview", "users", "teams", "chats"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs rounded ${tab === t ? "bg-[#6366f1] text-white" : "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { setAuthed(false); setToken(""); sessionStorage.removeItem("admin-token"); }}
          className="text-[#64748b] text-xs hover:text-white">logout</button>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">

        {/* Overview */}
        {tab === "overview" && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "users", value: stats.totalProfiles, color: "#6366f1" },
              { label: "teams", value: stats.totalTeams, color: "#ec4899" },
              { label: "full teams", value: stats.fullTeams, color: "#00e436" },
              { label: "total DMs", value: stats.totalMessages, color: "#ffec27" },
              { label: "DMs (24h)", value: stats.recentMessages, color: "#f97316" },
            ].map(s => (
              <div key={s.label} className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
                <p className="text-[#64748b] text-[10px] uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#334155] text-[#64748b]">
                  <th className="text-left p-3">name</th>
                  <th className="text-left p-3 hidden sm:table-cell">email</th>
                  <th className="text-left p-3 hidden sm:table-cell">gender</th>
                  <th className="text-left p-3">ig linked</th>
                  <th className="text-left p-3">signed up</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                    <td className="p-3 text-white">{p.name}</td>
                    <td className="p-3 text-[#94a3b8] hidden sm:table-cell">{p.email || "—"}</td>
                    <td className="p-3 text-[#94a3b8] hidden sm:table-cell">{p.gender || "—"}</td>
                    <td className="p-3">{p.ig_id ? <span className="text-[#00e436]">yes</span> : <span className="text-[#64748b]">no</span>}</td>
                    <td className="p-3 text-[#64748b]"><TimeAgo date={p.created_at} /></td>
                  </tr>
                ))}
                {profiles.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[#64748b]">no users yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Teams */}
        {tab === "teams" && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#334155] text-[#64748b]">
                  <th className="text-left p-3">code</th>
                  <th className="text-left p-3">player 1</th>
                  <th className="text-left p-3">player 2</th>
                  <th className="text-left p-3">status</th>
                  <th className="text-left p-3">created</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                    <td className="p-3 text-[#6366f1] font-mono">{t.code}</td>
                    <td className="p-3 text-white">{t.player1_name}</td>
                    <td className="p-3">{t.player2_name ? <span className="text-white">{t.player2_name}</span> : <span className="text-[#64748b]">waiting...</span>}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${t.status === "full" ? "bg-[#00e436]/20 text-[#00e436]" : t.status === "matched" ? "bg-[#6366f1]/20 text-[#6366f1]" : "bg-[#ffec27]/20 text-[#ffec27]"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#64748b]"><TimeAgo date={t.created_at} /></td>
                  </tr>
                ))}
                {teams.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[#64748b]">no teams yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Chats */}
        {tab === "chats" && (
          <div className="flex gap-4 h-[calc(100vh-120px)]">
            {/* Conversation list */}
            <div className="w-[240px] shrink-0 bg-[#1e293b] border border-[#334155] rounded-lg overflow-y-auto">
              <p className="p-3 text-[10px] text-[#64748b] uppercase tracking-wider border-b border-[#334155]">conversations</p>
              {convos.map(c => (
                <button key={c.userId} onClick={() => setSelectedConvo(c.userId)}
                  className={`w-full text-left p-3 border-b border-[#334155]/50 hover:bg-[#334155]/30 ${selectedConvo === c.userId ? "bg-[#334155]/50" : ""}`}>
                  <p className="text-xs text-white truncate">{c.userId.slice(0, 16)}...</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">{c.messages.length} msgs · <TimeAgo date={c.lastActivity} /></p>
                </button>
              ))}
              {convos.length === 0 && <p className="p-4 text-xs text-[#64748b] text-center">no conversations</p>}
            </div>

            {/* Messages */}
            <div className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg flex flex-col overflow-hidden">
              {selectedConvo ? (
                <>
                  <div className="p-3 border-b border-[#334155] text-xs text-[#94a3b8]">
                    {selectedConvo}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {convoMessages.map(m => (
                      <div key={m.id} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                          m.role === "assistant"
                            ? "bg-[#334155] text-[#e2e8f0]"
                            : "bg-[#6366f1] text-white"
                        }`}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p className="text-[9px] mt-1 opacity-50">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#64748b] text-sm">
                  select a conversation
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
