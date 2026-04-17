import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Boxes } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050810",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');
        .login-input {
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(8,13,26,0.9);
          border: 1px solid rgba(0,240,255,0.2);
          border-radius: 4px;
          color: #e8eaf0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 0 1px #00f0ff, 0 0 12px rgba(0,240,255,0.2);
        }
        .login-input::placeholder { color: #4a5068; }
        .login-btn {
          width: 100%;
          padding: 0.9rem;
          background: #00f0ff;
          color: #050810;
          border: none;
          border-radius: 4px;
          font-family: 'Orbitron', monospace;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-btn:hover { filter: brightness(1.15); box-shadow: 0 0 20px rgba(0,240,255,0.4); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: "rgba(0,240,255,0.08)",
            border: "1px solid rgba(0,240,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#00f0ff",
            boxShadow: "0 0 20px rgba(0,240,255,0.2)",
          }}>
            <Boxes size={32} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: 900, letterSpacing: 3, color: "#e8eaf0" }}>
              <span style={{ color: "#00f0ff", textShadow: "0 0 10px #00f0ff" }}>SHELF</span>SMART
            </p>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: "#4a5068", letterSpacing: 2, marginTop: 4 }}>
              // INVENTORY_SYS
            </p>
          </div>
        </div>

        {/* Form */}
        <div style={{
          background: "rgba(8,13,26,0.9)",
          border: "1px solid rgba(0,240,255,0.15)",
          borderRadius: 4,
          padding: "2rem",
        }}>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: "#4a5068", letterSpacing: 2, marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="login-input"
              />
            </div>

            <div>
              <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.65rem", color: "#4a5068", letterSpacing: 2, marginBottom: 6 }}>
                PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(255,32,32,0.1)",
                border: "1px solid rgba(255,32,32,0.3)",
                borderRadius: 4,
                padding: "0.75rem 1rem",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.72rem",
                color: "#ff4444",
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}