import { useState } from "react";
import { loginModalStore } from "../store/loginModalStore";
import API from "../services/api";
import "./LoginModal.css";

const LoginModal = () => {
  const isOpen = loginModalStore((s) => s.isOpen);
  const closeModal = loginModalStore((s) => s.closeModal);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      const { token, user } = res.data;

      // save token + user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      closeModal(); // ✅ close modal after login
      window.location.reload(); // optional: reload to refresh state
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gm-modal__overlay" onClick={closeModal}>
      <div
        className="gm-modal__panel gm-modal__panel--enter"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Login"
      >
        <button className="gm-modal__close" onClick={closeModal} aria-label="Close">
          ✖
        </button>

        <div className="gm-modal__header">
          <div className="gm-modal__icon">🔐</div>
          <h3 className="gm-modal__title">Welcome back</h3>
          <p className="gm-modal__subtitle">Sign in to continue</p>
        </div>

        <div className="gm-modal__content">
          <form onSubmit={handleSubmit} className="gm-form">
            {error && <p className="gm-error">{error}</p>}

            <div className="gm-form__group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="gm-form__group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="gm-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="gm-modal__footer">
          <p className="gm-modal__hint">
            New here? <a href="/signup" className="gm-link">Create an account</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
