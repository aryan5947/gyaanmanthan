import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import RichEditor from "./RichEditor";
import "./CreatePost.css";

interface EditPostProps {
  post: {
    _id: string;
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[] | string;
    images: string[]; // URLs of existing images
    [key: string]: any;
  };
  postFormat: "card" | "full";
  onUpdated?: (updated?: any) => void;
}

type PostPhase = "idle" | "uploading" | "processing" | "done" | "error";

export default function EditPost({ post, postFormat, onUpdated }: EditPostProps) {
  const [title, setTitle] = useState(post.title || "");
  const [description, setDescription] = useState(post.description || "");
  const [content, setContent] = useState(post.content || "");
  const [category, setCategory] = useState(post.category || "General");
  const [tags, setTags] = useState(
    Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || ""
  );
  const [existingImages, setExistingImages] = useState<string[]>(post.images || []);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removeImages, setRemoveImages] = useState<string[]>([]);
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<PostPhase>("idle");
  const [progress, setProgress] = useState<number>(0);
  const smoothTimerRef = useRef<number | null>(null);

  const [userName, setUserName] = useState<string>("");

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

  const removeExistingImage = (src: string) => {
    setRemoveImages((prev) => [...prev, src]);
    setExistingImages((prev) => prev.filter((img) => img !== src));
  };

  const resetForm = () => {
    setTitle(post.title || "");
    setDescription(post.description || "");
    setContent(post.content || "");
    setCategory(post.category || "General");
    setTags(Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "");
    setExistingImages(post.images || []);
    setImages([]);
    setPreviews([]);
    setRemoveImages([]);
    setShowPublicPreview(false);
    setPhase("idle");
    setProgress(0);
    setLoading(false);
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

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("tags", tags);
      if (removeImages.length > 0) {
        removeImages.forEach((url) => formData.append("removeImages", url));
      }
      images.forEach((img) => formData.append("images", img));

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
          alert("✅ Post updated successfully!");
          if (onUpdated) onUpdated(result.data);
          // Optionally reset or close the form/modal, or reload data
        } else {
          setPhase("error");
          alert(result.message || "❌ Failed to update post");
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        stopSmoothProcessing();
        setPhase("error");
        setLoading(false);
        alert("⚠️ Network error while updating post");
      };

      xhr.open("PUT", `${import.meta.env.VITE_API_URL}/api/posts/${post._id}`);
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
      {(previews.length > 0 || existingImages.length > 0) && <div className="background-overlay"></div>}

      <div className="create-post-inner">
        <div className="create-post-header">
          <span className="create-post-icon">✏️</span>
          <h2>
            {postFormat === "card" ? "Edit Card View Post" : "Edit Full Detail Post"}
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
            <span className="success-chip">✅ Updated</span>
          </div>
        )}
        {phase === "error" && (
          <div className="status-row">
            <span className="error-chip">⚠️ Update failed</span>
          </div>
        )}

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="image-preview-inline">
            {existingImages.map((src, idx) => (
              <div key={idx} className="image-preview-wrapper">
                <img src={src} alt={`Existing ${idx}`} className="image-preview" />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeExistingImage(src)}
                  title="Remove image"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New Previews */}
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
                {images.length > 0 ? "Change Images" : "Add New Images"}
              </label>
              {(images.length > 0 || previews.length > 0) && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => {
                    setImages([]);
                    setPreviews([]);
                  }}
                >
                  Remove New
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
                  ? `Updating ${progress}%…`
                  : "Updating…"
                : "Update Post"}
            </button>
          </div>
        </form>
      </div>

      {showPublicPreview && (
        <div className="public-preview-modal">
          <div className="public-preview-content">
            <button
              className="modal-close-icon"
              onClick={() => setShowPublicPreview(false)}
              title="Close Preview"
            >
              ✖
            </button>
            {[...existingImages, ...previews].map((src, idx) => (
              <img key={idx} src={src} alt={`Preview ${idx}`} />
            ))}
            <h2>{title}</h2>
            <p>
              <strong>By:</strong> {userName}
            </p>
            <p>
              <strong>Category:</strong> {category}
            </p>
            <p>
              <strong>Tags:</strong> {tags}
            </p>
            <p>{description}</p>
            <div className="public-preview-text">{content}</div>
            <div className="post-actions">
              <button>👍 Like</button>
              <button>🔗 Share</button>
              <button>➕ Follow</button>
            </div>
            <button
              className="close-preview-btn"
              onClick={() => setShowPublicPreview(false)}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}