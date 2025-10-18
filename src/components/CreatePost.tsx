import { useState, useEffect, useRef } from "react";
import RichEditor from "./RichEditor";
import "./CreatePost.css";

interface CreatePostProps {
  postFormat: "card" | "full";
}

type PostPhase = "idle" | "uploading" | "processing" | "done" | "error";

export default function CreatePost({ postFormat }: CreatePostProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const [userName, setUserName] = useState<string>("");

  // ✅ New state for Post or Both
  const [postTarget, setPostTarget] = useState<"post" | "both">("post");

  // Progress UI state
  const [phase, setPhase] = useState<PostPhase>("idle");
  const [progress, setProgress] = useState<number>(0);
  const smoothTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserName(parsed.name || parsed.username || "Anonymous");
      } catch {
        setUserName("Anonymous");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (smoothTimerRef.current) {
        window.clearInterval(smoothTimerRef.current);
      }
    };
  }, []);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImages(files);

    const urls: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === "string") {
          urls.push(result);
          if (urls.length === files.length) setPreviews(urls);
        }
      };
      reader.readAsDataURL(file);
    });

    if (files.length === 0) setPreviews([]);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setCategory("General");
    setTags("");
    setImages([]);
    setPreviews([]);
    setShowPublicPreview(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setPhase("uploading");
    setProgress(0);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not logged in");

      // Common form data (title, desc, etc.)
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("tags", tags);

      // ✅ For /api/posts (use "images")
      images.forEach((img) => formData.append("images", img));

      // ✅ For /api/post-meta (use "files")
      const formDataMeta = new FormData();
      formDataMeta.append("title", title);
      formDataMeta.append("description", description);
      formDataMeta.append("content", content);
      formDataMeta.append("category", category);
      formDataMeta.append("tags", tags);
      images.forEach((img) => formDataMeta.append("files", img));

      // ---- First API call: always /api/posts ----
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
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          setPhase("done");

          // ✅ If "both" selected → trigger post-meta call
          if (postTarget === "both") {
            const xhr2 = new XMLHttpRequest();
            xhr2.open("POST", `${import.meta.env.VITE_API_URL}/api/post-meta`);
            xhr2.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr2.send(formDataMeta);
          }

          alert("✅ Post created successfully!");
          resetForm();
        } else {
          setPhase("error");
          alert(result.message || "❌ Failed to create post");
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        stopSmoothProcessing();
        setPhase("error");
        setLoading(false);
        alert("⚠️ Network error while creating post");
      };

      xhr.open("POST", `${import.meta.env.VITE_API_URL}/api/posts`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      stopSmoothProcessing();
      setPhase("error");
      setLoading(false);
      console.error(err);
      alert("⚠️ Error connecting to server");
    }
  };

  return (
    <div className={`create-post-card ${postFormat === "full" ? "full-view" : "card-view"}`}>
      {previews.length > 0 && <div className="background-overlay"></div>}

      <div className="create-post-inner">
        <div className="create-post-header">
          <span className="create-post-icon">✏️</span>
          <h2>
            {postFormat === "card" ? "Create a Card View Post" : "Create a Full Detail Post"}
          </h2>
        </div>

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
            <span className="success-chip">✅ Posted</span>
          </div>
        )}
        {phase === "error" && (
          <div className="status-row">
            <span className="error-chip">⚠️ Post failed</span>
          </div>
        )}

        {previews.length > 0 && (
          <div className="image-preview-inline">
            {previews.map((src, idx) => (
              <img key={idx} src={src} alt={`Preview ${idx}`} className="image-preview" />
            ))}
          </div>
        )}

        <form className="create-post-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Short Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short summary for the feed..."
              rows={3}
              required
            />
          </div>

          <div className="row">
            <div className="field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="General">General</option>
                <option value="Study Tips">Study Tips</option>
                <option value="Coding">Coding</option>
                <option value="Motivation">Motivation</option>
              </select>
            </div>
            <div className="field">
              <label>Tags</label>
              <input
                type="text"
                value={tags}
                placeholder="Comma separated"
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Post Where?</label>
            <select
              value={postTarget}
              onChange={(e) => setPostTarget(e.target.value as "post" | "both")}
            >
              <option value="post">Post Only</option>
              <option value="both">Post + PostMeta (Both)</option>
            </select>
          </div>

          <div className="field">
            <label>Content</label>
            <RichEditor value={content} setValue={setContent} />
          </div>

          <div className="field image-upload-field">
            <label>Upload Images</label>
            <div className="image-upload-box">
              <input
                type="file"
                accept="image/*"
                id="image-upload"
                onChange={handleImageChange}
                multiple
              />
              <label htmlFor="image-upload" className="upload-btn">
                {images.length > 0 ? "Change Images" : "Select Images"}
              </label>
              {images.length > 0 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => {
                    setImages([]);
                    setPreviews([]);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              className="publish-btn ghost"
              onClick={() => setShowPublicPreview(true)}
              disabled={loading}
            >
              Preview
            </button>
            <button type="submit" className="publish-btn" disabled={loading}>
              {loading
                ? phase === "uploading" || phase === "processing"
                  ? `Posting ${progress}%…`
                  : "Publishing…"
                : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
