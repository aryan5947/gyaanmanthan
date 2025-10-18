import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import "./StatusView.css";

const apiBase = `${import.meta.env.VITE_API_URL}/api`;

type Status = {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isGoldenVerified?: boolean;
  createdAt: string;
  contentType: "text" | "image" | "video";
  content?: string;
  media?: { url: string; type?: "image" | "video" }[];
  likeCount?: number;
  viewCount?: number;
  reactions?: Record<string, number>;
};

export default function StoryViewPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [allStatuses, setAllStatuses] = useState<Status[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<{
    id: string;
    name: string;
    avatar: string;
    isGoldenVerified: boolean;
  }>({
    id: "",
    name: "",
    avatar: "",
    isGoldenVerified: false,
  });

  // ⏳ Timer logic
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(15); // default duration

  // Reaction popup state
  const [showReacts, setShowReacts] = useState(false);

  // ========== Enrich text (URLs and @mentions) ==========
  // Makes URLs clickable and @username navigate to profile without changing backend data
  const renderRichText = useCallback(
    (text: string) => {
      if (!text) return null;

      // Regex for URLs (http/https)
      const urlRegex = /(\bhttps?:\/\/[^\s]+)/gi;
      // Regex for @mentions (adjust allowed chars/length as per your username rules)
      const mentionRegex = /(^|[\s])@([a-zA-Z0-9_]{2,32})/g;

      type Segment = string | { type: "url"; url: string };

      // First pass: split URLs
      const urlSegments: Segment[] = [];
      let lastIndex = 0;
      text.replace(urlRegex, (match, _p1, offset: number) => {
        if (offset > lastIndex) {
          urlSegments.push(text.slice(lastIndex, offset));
        }
        urlSegments.push({ type: "url", url: match });
        lastIndex = offset + match.length;
        return match;
      });
      if (lastIndex < text.length) {
        urlSegments.push(text.slice(lastIndex));
      }
      if (urlSegments.length === 0) urlSegments.push(text);

      // Second pass: within non-URL strings, convert @mentions
      const nodes: React.ReactNode[] = [];
      urlSegments.forEach((seg, segIdx) => {
        if (typeof seg !== "string") {
          // URL node
          nodes.push(
            <a
              key={`url-${segIdx}-${seg.url}`}
              href={seg.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7ab8ff", textDecoration: "underline", pointerEvents: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              {seg.url}
            </a>
          );
          return;
        }

        // Handle mentions inside plain text segments
        let str = seg;
        let mLast = 0;
        let match: RegExpExecArray | null;
        // We need a fresh regex instance to use exec in a loop
        const re = new RegExp(mentionRegex);
        while ((match = re.exec(str)) !== null) {
          const full = match[0];
          const leading = match[1] || "";
          const username = match[2];

          const start = match.index;
          const end = start + full.length;

          if (start > mLast) {
            nodes.push(str.slice(mLast, start));
          }

          // keep leading whitespace if any
          if (leading) nodes.push(leading);

          nodes.push(
            <span
              key={`m-${segIdx}-${start}-${username}`}
              role="link"
              style={{ color: "#ffe08a", cursor: "pointer", fontWeight: 600, pointerEvents: "auto" }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${username}`);
              }}
              title={`@${username}`}
            >
              @{username}
            </span>
          );

          mLast = end;
        }

        if (mLast < str.length) {
          nodes.push(str.slice(mLast));
        }
      });

      return nodes;
    },
    [navigate]
  );
  // ======================================================

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${apiBase}/user/me`, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then((res) => {
        const u = res.data?.user || res.data;
        setAuth({
          id: u?._id || "",
          name: u?.name || u?.username || "User",
          avatar:
            u?.avatar ||
            u?.userAvatar ||
            "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
          isGoldenVerified: !!u?.isGoldenVerified,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios
      .get(`${apiBase}/status`)
      .then((res) => {
        const arr: Status[] = res.data.statuses || [];
        const userStories = arr
          .filter((st) => st.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllStatuses(userStories);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const status = allStatuses[currentIdx];
  const mediaList = status?.media || [];

  // Update duration when status or media changes
  useEffect(() => {
    if (!status) return;
    if (mediaList[currentMediaIdx]?.type === "video") {
      setDuration(0);
    } else {
      setDuration(15);
    }
    setSeek(0);
  }, [currentIdx, currentMediaIdx, status]);

  // Timer control
  useEffect(() => {
    if (!status) return;
    if (timerRef.current) clearInterval(timerRef.current);

    // Non-video: auto-progress
    if (mediaList[currentMediaIdx]?.type !== "video") {
      timerRef.current = setInterval(() => {
        setSeek((s) => {
          if (s + 1 >= duration) {
            handleNextMedia();
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [duration, status, currentMediaIdx]);

  // Delete status
  async function deleteStatus() {
    if (!auth.id || !status) return alert("Login required");
    if (auth.id !== status.userId) return alert("You can only delete your own status.");
    if (!window.confirm("Are you sure you want to delete this status?")) return;

    try {
      const res = await axios.delete(`${apiBase}/status/${String(status._id)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data?.ok) {
        alert(res.data.message || "Status deleted successfully");
      }

      setAllStatuses((prev) => {
        const updated = prev.filter((_, idx) => idx !== currentIdx);
        if (updated.length === 0) navigate(-1);
        else if (currentIdx >= updated.length) setCurrentIdx(updated.length - 1);
        return updated;
      });
    } catch (err: any) {
      console.error("Delete status error:", err);
      alert(err.response?.data?.message || "Failed to delete status.");
    }
  }

  // Handle video duration
  function handleVideoMeta(e: React.SyntheticEvent<HTMLVideoElement, Event>) {
    const d = Math.ceil(e.currentTarget.duration);
    const dur = d > 5 ? d : 20;
    setDuration(dur);
    setSeek(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeek((s) => {
        if (s + 1 >= dur) {
          handleNextMedia();
          return 0;
        }
        return s + 1;
      });
    }, 1000);
  }

  // Media navigation
  function handleNextMedia() {
    if (currentMediaIdx < mediaList.length - 1) {
      setCurrentMediaIdx((i) => i + 1);
    } else {
      goNext();
    }
  }

  function handlePrevMedia() {
    if (currentMediaIdx > 0) {
      setCurrentMediaIdx((i) => i - 1);
    } else {
      goPrev();
    }
  }

  // Status navigation
  function goPrev() {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setCurrentMediaIdx(0);
    }
  }

  function goNext() {
    if (currentIdx < allStatuses.length - 1) {
      setCurrentIdx((i) => i + 1);
      setCurrentMediaIdx(0);
    }
  }

  async function likeStatus() {
    if (!auth.id || !status) return alert("Login required");
    try {
      await axios.post(
        `${apiBase}/status/like`,
        { statusId: status._id, userId: auth.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setAllStatuses((prev) => {
        const copy = [...prev];
        copy[currentIdx] = {
          ...copy[currentIdx],
          likeCount: (copy[currentIdx].likeCount || 0) + 1,
        };
        return copy;
      });
    } catch {}
  }

  async function reactStatus(emoji: string) {
    if (!auth.id || !status) return;
    try {
      await axios.post(
        `${apiBase}/status/react`,
        { statusId: status._id, userId: auth.id, reaction: emoji },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setAllStatuses((prev) => {
        const copy = [...prev];
        copy[currentIdx] = {
          ...copy[currentIdx],
          reactions: {
            ...(copy[currentIdx].reactions || {}),
            [emoji]: (copy[currentIdx].reactions?.[emoji] || 0) + 1,
          },
        };
        return copy;
      });
    } catch {}
  }

  const popupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showReacts && popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowReacts(false);
      }
    }
    if (showReacts) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReacts]);

  if (loading)
    return (
      <div className="svp-root">
        <div className="svp-panel">
          <div className="svp-loading">Loading…</div>
        </div>
      </div>
    );

  if (!status)
    return (
      <div className="svp-root">
        <div className="svp-panel">
          <div className="svp-error">No stories for this user.</div>
        </div>
      </div>
    );

  const percent = duration > 0 ? Math.min(100, (seek / duration) * 100) : 0;
  const hasText = Boolean(status.content && status.content.trim());
  const isTextOnly = (!status.media || status.media.length === 0) && hasText;

  return (
    <div className="svp-root">
      <div className="svp-panel">
        {/* 🔹 Top Bar with Progress */}
        <div className="svp-topbar">
          <button className="svp-back" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="svp-progress">
            {allStatuses.map((_, idx) => (
              <div
                key={idx}
                className={`svp-bar${idx === currentIdx ? " svp-bar--active" : ""}`}
                style={{
                  flex: 1,
                  margin: "0 2px",
                  background: idx < currentIdx ? "#ffe08a" : "#222",
                  position: "relative",
                  height: "4px",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                {idx === currentIdx && (
                  <div
                    className="svp-bar-fill"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      background: "#ffe08a",
                      width: `${percent}%`,
                      borderRadius: "2px",
                      transition: "width 0.3s linear",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 Header */}
        <header className="svp-header">
          <div className="svp-user">
            <img className="svp-avatar" src={status.userAvatar || ""} alt={status.userName} />
            <div className="svp-user-meta">
              <div className="svp-name">
                {status.userName}
                {status.isGoldenVerified && (
                  <img src="/golden-tick.png" alt="Golden Verified" className="svp-gold" />
                )}
              </div>
              <div className="svp-time">
                {new Date(status.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </header>

        {/* 🔹 Main Body */}
        <main className="svp-body">
          {/* Text-only story */}
          {isTextOnly ? (
            <div className="svp-text-only">
              <div className="svp-text-only-inner">
                {renderRichText(status.content || "")}
              </div>
            </div>
          ) : (
            <div className="svp-media-wrapper">
              {mediaList.length > 1 && (
                <div className="svp-media-nav">
                  <button onClick={handlePrevMedia} disabled={currentMediaIdx === 0}>
                    ‹
                  </button>
                  <button onClick={handleNextMedia} disabled={currentMediaIdx === mediaList.length - 1}>
                    ›
                  </button>
                </div>
              )}

              {mediaList[currentMediaIdx]?.type === "image" && (
                <img src={mediaList[currentMediaIdx].url} className="svp-media svp-img" alt="" />
              )}

              {mediaList[currentMediaIdx]?.type === "video" && (
                <video
                  src={mediaList[currentMediaIdx].url}
                  className="svp-media svp-video"
                  controls
                  autoPlay
                  onLoadedMetadata={handleVideoMeta}
                />
              )}

              {/* Caption overlay if text exists along with media */}
              {hasText && (
                <div className="svp-caption" /* parent may have pointer-events: none in CSS */>
                  {/* Re-enable pointer events for interactive children */}
                  <div style={{ pointerEvents: "auto" }}>
                    {renderRichText(status.content || "")}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* 🔹 Footer */}
        <footer className="svp-actions">
          <div className="svp-reacts-trigger">
            <button className="svp-react-trigger-btn" onClick={() => setShowReacts((v) => !v)}>
              <span role="img" aria-label="React">
                😊
              </span>
            </button>
            {showReacts && (
              <div className="svp-reacts-popup" ref={popupRef}>
                {["👍", "❤️", "😂", "🔥", "😮"].map((em) => (
                  <button
                    key={em}
                    className="svp-react-btn"
                    onClick={() => {
                      reactStatus(em);
                      setShowReacts(false);
                    }}
                  >
                    <span>{em}</span>
                    <span className="svp-react-count">{status.reactions?.[em] || 0}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="svp-meta">
            <button className="svp-like" onClick={likeStatus}>
              ❤️ {status.likeCount || 0}
            </button>
            <span className="svp-views">👁️ {status.viewCount || 0}</span>
            {auth.id === status.userId && (
              <button className="svp-delete" style={{ color: "red", marginLeft: "12px" }} onClick={deleteStatus}>
                🗑
              </button>
            )}
          </div>

          <div className="svp-story-nav">
            <button onClick={goPrev} disabled={currentIdx === 0}>
              Prev
            </button>
            <span>
              {currentIdx + 1}/{allStatuses.length}
            </span>
            <button onClick={goNext} disabled={currentIdx === allStatuses.length - 1}>
              Next
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}