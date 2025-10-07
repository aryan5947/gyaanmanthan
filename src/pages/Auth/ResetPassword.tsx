import { useState, useEffect } from "react";

const APP_URL = import.meta.env.VITE_APP_URL || "http://gyaanmanthan.in";
const API_BASE = "https://electrical-olivie-gyaanmanthan-3337ed73.koyeb.app";

export default function ResetPassword() {
  const [status, setStatus] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setStatus("❌ Invalid or missing token");
      setDone(true);
    } else {
      setToken(t);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("❌ Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth-mail/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("✅ Password updated successfully! You can now log in.");
        setDone(true);
      } else {
        setStatus(`❌ ${data.message || "Reset failed"}`);
      }
    } catch {
      setStatus("❌ Server error");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Reset Password</h2>
      {status && <p>{status}</p>}
      {!done && token && (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ display: "block", margin: "10px auto", padding: "8px", width: "100%" }}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ display: "block", margin: "10px auto", padding: "8px", width: "100%" }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Save Password
          </button>
        </form>
      )}
      {done && (
        <button
          onClick={() => (window.location.href = APP_URL)}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#28a745",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Visit Website
        </button>
      )}
    </div>
  );
}
