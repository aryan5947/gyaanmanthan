import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import "./AdsPage.css";

interface Ad {
  _id: string;
  title: string;
  description: string;
  files: { url: string; type: string; name?: string; size?: number }[];
  ctaText?: string;
  ctaUrl?: string;
  stats: {
    views: number;
    clicks: number;
  };
  createdAt: string;
}

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

const AdsPage: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    ctaText: "",
    ctaUrl: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const smoothTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchAds();
    return () => {
      if (smoothTimerRef.current) window.clearInterval(smoothTimerRef.current);
    };
  }, []);

  const fetchAds = async () => {
    try {
      const res = await API.get("/ads");
      setAds(res.data.ads || []);
    } catch (err) {
      console.error("Error fetching ads", err);
      setErrorMsg("⚠️ Failed to load ads.");
    }
  };

  const startSmoothProcessing = () => {
    if (smoothTimerRef.current) window.clearInterval(smoothTimerRef.current);
    smoothTimerRef.current = window.setInterval(() => {
      setProgress((p) => (p < 99 ? p + 1 : 99));
    }, 400);
  };

  const stopSmoothProcessing = () => {
    if (smoothTimerRef.current) {
      window.clearInterval(smoothTimerRef.current);
      smoothTimerRef.current = null;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPhase("uploading");
    setProgress(0);
    setErrorMsg("");

    if (!form.title.trim()) {
      setErrorMsg("Title is required.");
      setLoading(false);
      setPhase("idle");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("ctaText", form.ctaText);
      formData.append("ctaUrl", form.ctaUrl);

      // Only single file allowed by backend
      if (files[0]) {
        const file = files[0];
        // Optionally filter types here if you want
        formData.append("file", file);
      }

      // Use XMLHttpRequest for progress
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const raw = Math.round((e.loaded / e.total) * 100);
          const capped = Math.min(raw, 95);
          setProgress(capped);
          if (capped >= 95 && phase !== "processing") {
            setPhase("processing");
            startSmoothProcessing();
          }
        }
      };

      xhr.onload = () => {
        stopSmoothProcessing();
        let result: any = {};
        try {
          result = JSON.parse(xhr.responseText || "{}");
        } catch {}
        if (xhr.status >= 200 && xhr.status < 300 && result.success) {
          setProgress(100);
          setPhase("done");
          setForm({ title: "", description: "", ctaText: "", ctaUrl: "" });
          setFiles([]);
          fetchAds();
        } else {
          setPhase("error");
          setErrorMsg(
            result.message ||
              (result.error ? result.error : "Failed to create ad.")
          );
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        stopSmoothProcessing();
        setPhase("error");
        setErrorMsg("Network error. Please try again.");
        setLoading(false);
      };

      xhr.open("POST", `${import.meta.env.VITE_API_URL || ""}/api/ads`);
      const token = localStorage.getItem("token");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    } catch (err: any) {
      stopSmoothProcessing();
      setPhase("error");
      setLoading(false);
      console.error("Error creating ad", err);
      setErrorMsg(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Server error while creating ad."
      );
    }
  };

  const handleClick = async (id: string) => {
    try {
      const res = await API.post(`/ads/${id}/click`);
      if (res.data.redirect) {
        window.open(res.data.redirect, "_blank");
      }
      fetchAds();
    } catch (err) {
      console.error("Error clicking ad", err);
    }
  };

  const handleFileRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    // Only allow one file (since backend expects single)
    setFiles(selectedFiles.slice(0, 1));
  };

  return (
    <div className="ads-page">
      <h1 className="ads-title">Ad Management</h1>

      {errorMsg && <p className="error">{errorMsg}</p>}

      {/* Progress UI */}
      {(phase === "uploading" || phase === "processing") && (
        <div
          className="progress-wrapper"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-chip">
            {phase === "uploading" ? "Uploading" : "Processing"} {progress}%
          </span>
        </div>
      )}
      {phase === "done" && (
        <div className="status-row">
          <span className="success-chip">✅ Ad created</span>
        </div>
      )}
      {phase === "error" && (
        <div className="status-row">
          <span className="error-chip">⚠️ Ad failed</span>
        </div>
      )}

      {/* Create Ad Form */}
      <form onSubmit={handleCreate} className="ad-form">
        <input
          className="ad-input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="ad-input"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="ad-input"
          placeholder="CTA Text"
          value={form.ctaText}
          onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
        />
        <input
          className="ad-input"
          placeholder="CTA URL"
          value={form.ctaUrl}
          onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
        />

        {/* File upload */}
        <label className="file-upload-label">
          📂 Upload File
          <input
            type="file"
            accept="image/*,video/mp4,application/pdf,.doc,.docx,.ppt,.pptx"
            multiple={false}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>

        {/* Previews */}
        {files.length > 0 && (
          <div className="preview">
            <p>Selected File:</p>
            <div className="preview-list">
              {files.map((file, i) => (
                <div key={i} className="preview-item">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="preview-image"
                    />
                  ) : (
                    <p className="file-info">
                      📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => handleFileRemove(i)}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="ad-button" disabled={loading}>
          {loading ? "Creating..." : "Create Ad"}
        </button>
      </form>

      {/* Ads List */}
      <div className="ads-list">
        {ads.length > 0 ? (
          ads.map((ad) => (
            <div key={ad._id} className="ad-card">
              <h3 className="ad-card-title">{ad.title}</h3>
              <p className="ad-card-body">{ad.description}</p>

              {ad.files?.length > 0 &&
                ad.files.map((file, i) =>
                  file.type?.startsWith("image") ? (
                    <img
                      key={i}
                      src={file.url}
                      alt={ad.title}
                      className="ad-card-image"
                    />
                  ) : (
                    <p key={i}>
                      📄 <a href={file.url}>{file.name || "View File"}</a>
                    </p>
                  )
                )}

              <p className="ad-card-stats">
                <strong>Views:</strong> {ad.stats?.views || 0} |{" "}
                <strong>Clicks:</strong> {ad.stats?.clicks || 0}
              </p>

              <button
                onClick={() => handleClick(ad._id)}
                className="ad-card-button"
              >
                {ad.ctaText || "Visit"}
              </button>
            </div>
          ))
        ) : (
          <p className="no-ads">No ads available</p>
        )}
      </div>
    </div>
  );
};

export default AdsPage;