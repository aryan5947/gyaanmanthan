import { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/useUser";
import PostResultModal from "./PostResultModal"; // ✅ नया modal import
import "./PostMeta.css";

export default function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<
    "idle" | "uploading" | "processing" | "done" | "error"
  >("idle");
  const [resultModal, setResultModal] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { user, loading: userLoading } = useUser();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const smoothTimerRef = useRef<number | null>(null);

  // ✅ Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [title]);

  const startSmoothProcessing = () => {
    if (smoothTimerRef.current) window.clearInterval(smoothTimerRef.current);
    smoothTimerRef.current = window.setInterval(() => {
      setProgress((p) => (p < 99 ? p + 1 : 99));
    }, 450);
  };

  const stopSmoothProcessing = () => {
    if (smoothTimerRef.current) {
      window.clearInterval(smoothTimerRef.current);
      smoothTimerRef.current = null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];

    const valid = selected.filter((file) => {
      const type = file.type;
      if (type.startsWith("image/")) return true;
      if (type === "video/mp4" || type === "video/webm") return true;
      if (type === "application/pdf") return true;
      if (
        type.includes("word") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx")
      )
        return true;
      if (
        type.includes("presentation") ||
        file.name.endsWith(".ppt") ||
        file.name.endsWith(".pptx")
      )
        return true;
      return false;
    });

    if (valid.length !== selected.length) {
      alert(
        "⚠️ Some files are not supported. Please upload only Images, MP4/WebM videos, PDF, Word or PPT."
      );
    }

    setFiles((prev) => [...prev, ...valid]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setPhase("error");
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not logged in");

      const formData = new FormData();
      formData.append("title", title);
      files.forEach((file) => formData.append("files", file));

      setPhase("uploading");
      setProgress(0);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const raw = Math.round((e.loaded / e.total) * 100);
          const capped = Math.min(raw, 95);
          setProgress(capped);
          if (capped >= 95) {
            setPhase((prev) => {
              if (prev !== "processing") {
                startSmoothProcessing();
                return "processing";
              }
              return prev;
            });
          }
        }
      };

      xhr.onload = () => {
        stopSmoothProcessing();
        let result: any = {};
        try {
          result = JSON.parse(xhr.responseText || "{}");
        } catch {}
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          setPhase("done");
          setResultModal({
            success: true,
            message: "Post created successfully!",
          });
          onClose();
        } else {
          setPhase("error");
          setResultModal({
            success: false,
            message: result.message || "Failed to create post",
          });
          onClose();
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        stopSmoothProcessing();
        setPhase("error");
        setResultModal({
          success: false,
          message: "Network error while creating post",
        });
        setLoading(false);
        onClose();
      };

      xhr.open("POST", `${import.meta.env.VITE_API_URL}/api/post-meta`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setPhase("error");
      setResultModal({
        success: false,
        message: "Error connecting to server",
      });
      setLoading(false);
      onClose();
    }
  };

  const renderFilePreview = (file: File, idx: number) => {
    const type = file.type;
    const isImage = type.startsWith("image/");
    const isVideo = type.startsWith("video/");
    const isPDF = type === "application/pdf";
    const isWord =
      type.includes("word") ||
      file.name.endsWith(".doc") ||
      file.name.endsWith(".docx");
    const isPPT =
      type.includes("presentation") ||
      file.name.endsWith(".ppt") ||
      file.name.endsWith(".pptx");

    return (
      <div key={idx} className="preview-item">
        {isImage ? (
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="preview-image"
          />
        ) : isVideo ? (
          file.type === "video/mp4" || file.type === "video/webm" ? (
            <video
              src={URL.createObjectURL(file)}
              className="preview-video"
              controls
              playsInline
              muted
              autoPlay
              loop
              onError={() =>
                console.error("Video load error. Possibly unsupported codec.")
              }
              onLoadedData={() =>
                console.log("Video loaded successfully:", file.name)
              }
            />
          ) : (
            <div className="file-icon-preview unsupported">
              <i className="fa-solid fa-video-slash"></i>
              <span>Unsupported video format</span>
              <small>{file.name}</small>
            </div>
          )
        ) : isPDF ? (
          <div className="file-icon-preview pdf">
            <i className="fa-solid fa-file-pdf"></i>
            <span>{file.name}</span>
          </div>
        ) : isWord ? (
          <div className="file-icon-preview word">
            <i className="fa-solid fa-file-word"></i>
            <span>{file.name}</span>
          </div>
        ) : isPPT ? (
          <div className="file-icon-preview ppt">
            <i className="fa-solid fa-file-powerpoint"></i>
            <span>{file.name}</span>
          </div>
        ) : (
          <div className="file-icon-preview unsupported">
            <i className="fa-solid fa-file"></i>
            <span>Unsupported: {file.name}</span>
          </div>
        )}
        <button
          type="button"
          className="cut-btn"
          title="Remove this file"
          onClick={() => handleRemoveFile(idx)}
        >
          ✖
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="post-modal-overlay" onClick={onClose}>
        <div
          className="post-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <button
              className="modal-close-btn"
              onClick={onClose}
              title="Close"
              type="button"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {(phase === "uploading" || phase === "processing") && (
              <div className="progress-wrapper">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
                <span className="progress-chip">
                  {phase === "uploading" ? "Uploading" : "Processing"}{" "}
                  {progress}%
                </span>
              </div>
            )}

            <div className="modal-body">
              {!userLoading && user && (
                <div className="user-info">
                  <img
                    src={user.avatarUrl || "/default-avatar.png"}
                    alt={user.name}
                    className="userAvatar"
                  />
                  <div className="user-text">
                    <span className="name">{user.name}</span>
                    <span className="username">@{user.username}</span>
                  </div>
                </div>
              )}
              <div className="input-area">
                <textarea
                  ref={textareaRef}
                  className="main-textarea"
                  placeholder="Write your title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={1}
                  style={{ height: "auto" }}
                />

                {files.length > 0 && (
                  <div className="preview-container">
                    {files.map((file, idx) => renderFilePreview(file, idx))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <div className="action-icons">
                <label htmlFor="image-upload" className="action-icon-btn">
                  <i className="fa-regular fa-image"></i>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  multiple
                />

                <label htmlFor="video-upload" className="action-icon-btn">
                  <i className="fa-solid fa-video"></i>
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleFileChange}
                  multiple
                />

                <label htmlFor="pdf-upload" className="action-icon-btn">
                  <i className="fa-solid fa-file-pdf"></i>
                </label>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  multiple
                />

                <label htmlFor="word-upload" className="action-icon-btn">
                  <i className="fa-solid fa-file-word"></i>
                </label>
                <input
                  id="word-upload"
                  type="file"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  multiple
                />

                <label htmlFor="ppt-upload" className="action-icon-btn">
                  <i className="fa-solid fa-file-powerpoint"></i>
                </label>
                <input
                  id="ppt-upload"
                  type="file"
                  accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleFileChange}
                  multiple
                />
              </div>

              <button
                type="button"
                className="main-cut-btn"
                onClick={onClose}
              >
                ✖ Cancel
              </button>
              <button
                type="submit"
                className="post-btn"
                disabled={loading || !title.trim()}
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Result Modal trigger */}
      {resultModal && (
        <PostResultModal
          success={resultModal.success}
          message={resultModal.message}
          onClose={() => setResultModal(null)}
        />
      )}
    </>
  );
}
