import { useEffect, useState } from "react";

const APP_URL = import.meta.env.VITE_APP_URL || "http://gyaanmanthan.in";
const API_BASE = "https://electrical-olivie-gyaanmanthan-3337ed73.koyeb.app";

export default function VerifyEmail() {
  const [status, setStatus] = useState("Verifying...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("❌ No token found");
      setDone(true);
      return;
    }

    fetch(`${API_BASE}/api/auth-mail/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("✅ Email verified successfully! You can now log in.");
        } else {
          setStatus(`❌ ${data.message || "Verification failed"}`);
        }
        setDone(true);
      })
      .catch(() => {
        setStatus("❌ Server error");
        setDone(true);
      });
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{status}</h2>
      {done && (
        <button
          onClick={() => (window.location.href = APP_URL)}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#007bff",
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
