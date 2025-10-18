import React, { useState } from "react";
import axios from "axios";
import "./StatusTextCreate .css";
import {
  XMarkIcon
} from "@heroicons/react/24/outline";
const apiBase = `${import.meta.env.VITE_API_URL}/api`;

export default function StatusTextCreate() {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("contentType", "text");
      formData.append("privacy", privacy);
      if (tags.trim().length) formData.append("tags", tags);

      const token = localStorage.getItem("token");
      const res = await axios.post(`${apiBase}/status`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.data.ok) {
        setContent("");
        setTags("");
        setPrivacy("public");
        setSuccess("Status posted successfully!");
      } else {
        setError(res.data.message || "Unknown error");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to post status"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="status-form">
  {/* CLOSE BUTTON: Actual clickable X in top-left */}
  <button
    type="button"
    className="status-close-btn"
    onClick={() => {
      // Close logic: use navigate(-1) or setShowModal(false) as per your routing/modal setup
      if (typeof window !== "undefined") window.history.back();
      // OR use: navigate(-1); // if you have useNavigate from react-router
    }}
    aria-label="Close"
  >
    <XMarkIcon className="h-7 w-7" />
  </button>

  <textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="What's on your mind?"
    rows={4}
    maxLength={1000}
    disabled={loading}
    required
  />
  <input
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="Tags (comma separated)"
    disabled={loading}
    maxLength={100}
  />
  <select
    value={privacy}
    onChange={(e) => setPrivacy(e.target.value)}
    disabled={loading}
  >
    <option value="public">Public</option>
    <option value="friends">Friends</option>
    <option value="private">Private</option>
  </select>
  {error && <div className="form-error">{error}</div>}
  {success && <div style={{ color: "green" }}>{success}</div>}
  <button type="submit" disabled={loading || !content.trim()}>
    {loading ? "Posting..." : "Post Text Status"}
  </button>
</form>
  );
}