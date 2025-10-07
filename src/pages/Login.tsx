import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

// एक छोटा helper: Retry के साथ fetch, 429/503 पर backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  cfg: { retries?: number; retryOn?: number[]; baseDelayMs?: number } = {}
): Promise<Response> {
  const retries = cfg.retries ?? 2;              // कुल अतिरिक्त प्रयास
  const retryOn = cfg.retryOn ?? [429, 503];     // किन status पर retry करना है
  const baseDelayMs = cfg.baseDelayMs ?? 1000;   // शुरुआती delay

  let attempt = 0;
  let lastError: any;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);

      if (!retryOn.includes(res.status)) {
        return res; // retry की ज़रूरत नहीं
      }

      // 429/503 मिला: Retry-After देखें
      let waitMs = baseDelayMs * Math.pow(2, attempt); // exponential backoff
      const retryAfter = res.headers.get("retry-after");
      if (retryAfter) {
        const seconds = Number(retryAfter);
        if (!isNaN(seconds) && seconds >= 0) {
          waitMs = Math.max(waitMs, seconds * 1000);
        }
      }

      if (attempt === retries) {
        return res; // और retry नहीं, यहीं लौटा दें
      }

      await new Promise((r) => setTimeout(r, waitMs));
      attempt++;
      continue;
    } catch (err) {
      lastError = err;
      if (attempt === retries) throw err;
      const waitMs = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, waitMs));
      attempt++;
    }
  }

  // fallback
  if (lastError) throw lastError;
  throw new Error("Request failed");
}

// content-type के हिसाब से सुरक्षित parse
async function safeParse(res: Response): Promise<{ isJson: boolean; body: any }> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      const j = await res.json();
      return { isJson: true, body: j };
    } catch {
      // JSON header था पर body टूट गई
      const t = await res.text();
      return { isJson: false, body: t };
    }
  }
  const t = await res.text();
  return { isJson: false, body: t };
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [loginToken, setLoginToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const connectTelegram = async () => {
    if (!loginToken) return;
    try {
      // axios के साथ भी 429 आ सकता है, इसलिए try/catch + message
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/connect-telegram-test`,
        {
          headers: { Authorization: `Bearer ${loginToken}` },
          timeout: 10000,
          validateStatus: () => true, // ताकि non-2xx पर भी error throw ना हो
        }
      );

      if (res.status === 429) {
        const retryAfter = res.headers["retry-after"];
       const waitMsg = retryAfter
       ? `⏳ Please try again after ${retryAfter} seconds.`
       : "🔄 Please try again after some time.";
        alert(`🚫 Too many requests . ${waitMsg}`);
        return;
      }

      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        if (data?.authUrl) {
          window.open(data.authUrl, "_blank");
        } else if (data?.message) {
          alert(`❌ ${data.message}`);
        } else {
          alert("❌ Oops! Couldn’t start the Telegram connection. Try again later.");
        }
      } else {
        // Non-2xx
        const msg = typeof res.data === "string" ? res.data : res.data?.message || "Server error";
       alert("❌ Telegram connection failed. Please try again later.");
      }
    } catch (error: any) {
      console.error("❌ Telegram connect error:", error);
     alert("❌ Oops! There was a problem connecting to Telegram. Please try again.");
    } finally {
      setShowTelegramModal(false);
      navigate("/profile", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // double-click guard
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_API_URL}/api/auth/login`;

      const res = await fetchWithRetry(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(formData),
        },
        {
          retries: 2,         // ज़रूरत अनुसार बदलें
          retryOn: [429, 503],
          baseDelayMs: 1200,  // ज़्यादा सख्त rate limit पर थोड़ा बढ़ा सकते हैं
        }
      );

      // 429 आने पर graceful message
      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
       const waitMsg = retryAfter
       ? `Please try again after ${retryAfter} seconds.`
       : "Please try again after some time.";
        const { isJson, body } = await safeParse(res);
        const serverMsg = isJson ? (body?.message || "") : String(body || "");
       alert(`🚫 Too many requests. ${waitMsg}${serverMsg ? `\n🖥️ Server: ${serverMsg}` : ""}`);
        return;
      }

      const { isJson, body } = await safeParse(res);
      // body JSON हुआ तो object होगा, वरना string

      if (res.ok) {
        const result = isJson ? body : {};
        const token = result?.token;
        const user = result?.user;

        if (!token) {
          // कभी-कभी server ok देगा पर token ना भेजे
         alert("✅ Login successful, but ⚠️ token not found. Please try again.");
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("userId", user?._id || user?.id || "");
        if (user) localStorage.setItem("user", JSON.stringify(user));

       alert("🎉 You’re logged in!");
        setLoginToken(token);
        setShowTelegramModal(true);
      } else {
        // Non-OK response
        let msg = "Login विफल";
        if (isJson && body?.message) {
          msg = body.message;
        } else if (!isJson && typeof body === "string" && body.trim()) {
          // जैसे "Too many requests" plain text
          msg = body;
        } else {
          msg = `HTTP ${res.status}`;
        }
        alert(msg);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert("There was a problem connecting to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <h1 className="login__title">Welcome Back 👋</h1>
      <p className="login__subtitle">Log in to continue your journey</p>

      <form className="login__form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="username"
        />
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="login__alt">
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>
      </form>

      {showTelegramModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Connect Telegram</h2>
            <p>
              Telegram से connect करने के लिए नीचे बटन दबाएँ. 
              नहीं करना है तो Skip पर क्लिक करें.
            </p>
            <div className="modal-actions">
              <button className="btn btn--primary" onClick={connectTelegram}>
                Connect Now
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setShowTelegramModal(false);
                  navigate("/profile", { replace: true });
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LoginPage;