import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import "./Signup.css";

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    dob: "",
    gender: "",
    bio: "",
    website: "",
    location: "",
    avatar: null as File | null,
    banner: null as File | null, // ✅ Added banner
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null); // ✅ Banner preview
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Terms modal state
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // ---------- Emoji blocking helpers (added) ----------
  // Remove emoji and most pictographic symbols, ZWJ sequences, variation selectors
  const stripEmojis = (s: string) =>
    s
      .replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])|\uFE0F|\u200D/g, "")
      .replace(
        /[\u2190-\u21FF\u2300-\u23FF\u2460-\u24FF\u25A0-\u27BF\u2900-\u297F\u2B00-\u2BFF\u3030\u303D\u3297\u3299\u{1F000}-\u{1FAFF}]/gu,
        ""
      );

  // Username: a-z 0-9 . _ - only, 3–20 chars
  const sanitizeUsername = (s: string) =>
    stripEmojis(s).toLowerCase().replace(/[^a-z0-9._-]/g, "");

  const isValidUsername = (s: string) => /^[a-z0-9._-]{3,20}$/.test(s);

  // Full name: English + Devanagari letters, space, dot, hyphen
  const sanitizeFullName = (s: string) => {
    const noEmoji = stripEmojis(s);
    let cleaned = noEmoji.replace(/[^A-Za-z\u0900-\u097F .-]/g, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return cleaned;
  };
  const isValidFullName = (s: string) => s.length >= 2 && s.length <= 60;

  // IME composition guard for Hindi/other keyboards
  const [isComposing, setIsComposing] = useState(false);

  // Extra: paste sanitizer (added)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const name = target.name;
    const text = e.clipboardData.getData("text");

    let v = text;
    if (name === "username") v = sanitizeUsername(v);
    if (name === "fullName") v = sanitizeFullName(v);

    e.preventDefault();
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const next = target.value.slice(0, start) + v + target.value.slice(end);
    setFormData((p) => ({ ...p, [name]: next }));
  };

  // Extra: prevent spaces in username via keyboard (added)
  const preventSpaceInUsername = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (name === "username" && e.key === " ") e.preventDefault();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, files, type, checked } = e.target as HTMLInputElement;

    if (type === "checkbox" && name === "terms") {
      setAcceptedTerms(checked);
      return;
    }

    if (files && name === "avatar") {
      const file = files[0];
      setFormData({ ...formData, avatar: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    } else if (files && name === "banner") {
      const file = files[0];
      setFormData({ ...formData, banner: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // ADDED: sanitize on change, but do not interfere during IME composition
      if (isComposing) {
        setFormData({ ...formData, [name]: value });
        return;
      }
      let v = value;
      if (name === "username") v = sanitizeUsername(v);
      else if (name === "fullName") v = sanitizeFullName(v);

      setFormData({ ...formData, [name]: v });
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  };

  const handleCropDone = async () => {
    if (preview && croppedAreaPixels) {
      const croppedBlob = await getCroppedImg(preview, croppedAreaPixels);
      if (croppedBlob) {
        const file = new File([croppedBlob], "avatar.jpg", {
          type: "image/jpeg",
        });
        setFormData({ ...formData, avatar: file });
        setPreview(URL.createObjectURL(file));
      }
    }
    setCropMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      alert("Please accept the Terms & Conditions before signing up.");
      return;
    }

    // ADDED: final frontend-only enforcement
    const finalFullName = sanitizeFullName(formData.fullName);
    const finalUsername = sanitizeUsername(formData.username);
    if (!isValidFullName(finalFullName)) {
      alert("Enter a valid name (no emojis, 2–60 chars).");
      return;
    }
    if (!isValidUsername(finalUsername)) {
      alert("Enter a valid username (3–20, a-z, 0-9, ., _, -).");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();

      // ✅ Map correct fields only (using sanitized values)
      if (finalFullName) data.append("name", finalFullName);
      if (finalUsername) data.append("username", finalUsername);
      if (formData.email) data.append("email", formData.email);
      if (formData.password) data.append("password", formData.password);
      if (formData.phone) data.append("phone", formData.phone);
      if (formData.dob) data.append("dob", formData.dob);
      if (formData.gender) data.append("gender", formData.gender);
      if (formData.bio) data.append("bio", formData.bio);
      if (formData.website) data.append("website", formData.website);
      if (formData.location) data.append("location", formData.location);

      if (formData.avatar) data.append("avatar", formData.avatar);
      if (formData.banner) data.append("banner", formData.banner);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await res.json();
      console.log("Signup Response:", result);

      if (res.ok) {
        localStorage.setItem("token", result.token);
        localStorage.setItem(
          "userId",
          result.user?._id || result.user?.id || ""
        );
        localStorage.setItem("user", JSON.stringify(result.user));

        alert("Signup successful!");
        navigate("/profile", { replace: true });
      } else {
        alert(result.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="signup">
      <h2 className="signup__title">📝 Create Account</h2>
      <p className="signup__subtitle">
        Fill in your details to create your profile
      </p>

      <form onSubmit={handleSubmit} className="signup__form">
        {/* ✅ Banner Section */}
        <fieldset>
          <legend>Profile Banner</legend>

          {bannerPreview ? (
            <div className="signup__banner-preview">
              <img src={bannerPreview} alt="Banner Preview" />
            </div>
          ) : (
            <div className="signup__banner-preview placeholder">
              <img src="/banner-placeholder.png" alt="Banner Placeholder" />
            </div>
          )}

          <label htmlFor="banner" className="upload-btn">
            Choose Banner Image
          </label>

          <input
            type="file"
            id="banner"
            name="banner"
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />

          {formData.banner && (
            <div className="remove-btn-wrapper">
              <button
                type="button"
                className="remove-btn"
                onClick={() => {
                  setBannerPreview(null);
                  setFormData({ ...formData, banner: null });
                }}
              >
                Remove Banner
              </button>
            </div>
          )}
        </fieldset>

        {/* ✅ Avatar Section */}
        <fieldset>
          <legend>Profile Picture</legend>

          {/* Avatar Cropper */}
          {cropMode && preview ? (
            <div className="signup__cropper-overlay">
              <div className="signup__cropper-container">
                <div className="signup__cropper-area">
                  <Cropper
                    image={preview}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>

                <div className="signup__cropper-controls">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                  <div className="signup__cropper-actions">
                    <button
                      type="button"
                      onClick={() => setCropMode(false)}
                      className="btn btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCropDone}
                      className="btn btn--primary"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : preview ? (
            <div className="signup__preview">
              <img
                src={preview}
                alt="Profile Preview"
                className="signup__preview-img"
              />
            </div>
          ) : (
            <div className="signup__preview placeholder">
              <img
                src="/avatar-placeholder.png"
                alt="Placeholder"
                className="signup__preview-img"
              />
            </div>
          )}

          <label htmlFor="avatar" className="upload-btn">
            Choose Profile Picture
          </label>

          <input
            type="file"
            id="avatar"
            name="avatar"
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />

          {formData.avatar && !preview && (
            <p style={{ marginTop: "8px", fontSize: "14px" }}>
              Selected: {formData.avatar.name}
            </p>
          )}

          {formData.avatar && (
            <div className="remove-btn-wrapper">
              <button
                type="button"
                className="remove-btn"
                onClick={() => {
                  setPreview(null);
                  setFormData({ ...formData, avatar: null });
                }}
              >
                Remove Picture
              </button>
            </div>
          )}
        </fieldset>

        {/* Basic Info */}
        <fieldset>
          <legend>Basic Info</legend>
          <input
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            onPaste={handlePaste}                 // ADDED
            onCompositionStart={() => setIsComposing(true)} // ADDED
            onCompositionEnd={(e) => {            // ADDED
              setIsComposing(false);
              const v = sanitizeFullName((e.target as HTMLInputElement).value);
              setFormData((p) => ({ ...p, fullName: v }));
            }}
            required
          />
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            onPaste={handlePaste}                 // ADDED
            onKeyDown={preventSpaceInUsername}    // ADDED
            onCompositionStart={() => setIsComposing(true)} // ADDED
            onCompositionEnd={(e) => {            // ADDED
              setIsComposing(false);
              const v = sanitizeUsername((e.target as HTMLInputElement).value);
              setFormData((p) => ({ ...p, username: v }));
            }}
            required
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            pattern="[a-z0-9._-]{3,20}"
            title="3–20: a-z, 0-9, ., _, -"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </fieldset>

        {/* Additional Info */}
        <fieldset>
          <legend>Additional Info</legend>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="male">Male ♂️</option>
            <option value="female">Female ♀️</option>
            <option value="other">Other ⚧️</option>
          </select>
          <textarea
            name="bio"
            placeholder="Write something about yourself..."
            value={formData.bio}
            onChange={handleChange}
            rows={3}
          />
          <input
            type="url"
            name="website"
            placeholder="Website / Link"
            value={formData.website}
            onChange={handleChange}
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />
        </fieldset>

        {/* Terms & Conditions */}
        <div className="terms-container">
          <input
            type="checkbox"
            name="terms"
            id="terms"
            checked={acceptedTerms}
            onChange={handleChange}
          />
          <label htmlFor="terms">
            I agree to the{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setShowTerms(true)}
            >
              Terms & Conditions
            </button>
          </label>
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? "Creating..." : "Create Profile"}
        </button>

        <p className="signup__alt">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </form>

      {/* Terms Modal */}
      {showTerms && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowTerms(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3>📜 Terms & Conditions</h3>
            <div className="modal-content">
              <p>
                By creating an account, you agree not to post, upload, or share
                content that includes:
              </p>
              <ul>
                <li>🚫 Nudity, sexual content, or pornography</li>
                <li>🚫 Hate speech, threats, harassment, or bullying</li>
                <li>🚫 Violence, gore, or graphic injury content</li>
                <li>🚫 Copyrighted or pirated material without permission</li>
                <li>🚫 Spam, scams, fake news, or misleading information</li>
                <li>🚫 Promotion of drugs, weapons, or illegal substances</li>
                <li>🚫 Impersonation of other users, celebrities, or organizations</li>
                <li>🚫 Attempts to hack, exploit, or disrupt the platform</li>
                <li>🚫 Sharing of personal/private data of others without consent</li>
                <li>🚫 Any content that violates applicable laws in your country</li>
              </ul>

              <h4>✅ Your Responsibilities</h4>
              <ul>
                <li>✔️ Provide accurate account information (name, email, etc.)</li>
                <li>✔️ Keep your account secure and do not share your password</li>
                <li>✔️ Report abusive or harmful content using the reporting tools</li>
                <li>✔️ Respect other users’ opinions and maintain healthy discussions</li>
              </ul>

              <h4>⚠️ Consequences</h4>
              <p>
                Violation of these rules may result in:
                <ul>
                  <li>❌ Removal of your content</li>
                  <li>❌ Temporary or permanent account suspension</li>
                  <li>❌ Reporting to authorities if required by law</li>
                </ul>
              </p>

              <p>
                By signing up, you confirm that you are at least 13 years of age
                (or the minimum legal age in your country) and you agree to
                follow these community guidelines.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Signup;
