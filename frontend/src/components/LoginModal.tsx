import { useState } from "react";
import { login, register } from "../api/applications";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const { login: setAuthToken } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let access_token;
      if (mode === "login") {
        const res = await login(username, password);
        access_token = res.access_token;
      } else {
        const res = await register(username, password, email);
        access_token = res.access_token;
      }
      setAuthToken(access_token);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials or username already exists.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="card-header" style={{ marginBottom: "1rem" }}>
          <div className="card-title">{mode === "login" ? "Log In" : "Register"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        
        {error && <div className="alert alert-danger" style={{ fontSize: "0.8rem", padding: "8px 12px" }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="form-group">
          <label>Username</label>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            autoFocus 
          />
          
          {mode === "register" && (
            <>
              <label style={{ marginTop: "10px" }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </>
          )}

          <label style={{ marginTop: "10px" }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? "Processing..." : (mode === "login" ? "Log In" : "Register")}
            </button>
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ width: "100%", justifyContent: "center" }} 
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Need an account? Register" : "Already have an account? Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
