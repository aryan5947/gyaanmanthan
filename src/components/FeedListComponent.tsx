import React, { useState, useEffect, useRef } from "react";
import SEO from "../components/SEO";
// import { useParams } from "react-router-dom"; // not used
// import { useApi } from "../hooks/useApi"; // not used
import PostFilters from "../components/PostFilters";
import ShareModal from "../components/ShareModal";
import CommentsModal from "../components/postMetacomments";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import AdSlot from "./AdSlot";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./FeedPage.css";
import {
  HeartIcon as HeartIconOutline,
  BookmarkIcon as BookmarkIconOutline,
  ShareIcon,
  ChatBubbleOvalLeftIcon,
  FlagIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from "@heroicons/react/24/solid";

// ---------- Interfaces ----------

interface Author {
  _id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  isGoldenVerified?: boolean;
}

interface FileItem {
  url: string;
  type: "image" | "video" | "pdf" | "file";
  name?: string;
  size?: number;
  _id?: string;
}

export interface Post {
  _id: string;

  // Common fields
  title?: string;
  description?: string;
  content?: any;
  category?: string;
  tags?: string[];
  files?: FileItem[];

  // Author info
  author?: Author;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  isGoldenVerified?: boolean;

  // Type discriminator
  postType: "post" | "ad";

  // Ad-specific fields
  ctaText?: string;
  ctaUrl?: string;

  // Status & moderation
  status?: "active" | "restricted" | "blocked" | "deleted";
  restrictionReason?: string;
  copyrightScanStatus?: "pending" | "approved" | "rejected";

  // Metadata
  createdAt?: string | number;
  updatedAt?: string | number;

  // Engagement stats
  stats: {
    views: number;
    likes: number;
    saves?: number;
    comments?: number;
    shares?: number;
    reports?: number;
    clicks?: number; // ad-specific
  };

  // User interactions
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
}

// ---------- Helpers ----------

const normalizeContent = (content: any): any[] => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return [parsed];
      } catch {}
    }
    return [{ type: "paragraph", children: [{ text: content }] }];
  }
  return [];
};

const contentToPlainText = (content: any): string => {
  const blocks = normalizeContent(content);
  return blocks
    .map((block: any) =>
      Array.isArray(block?.children)
        ? block.children.map((c: any) => c?.text || "").join("")
        : ""
    )
    .join(" ")
    .trim();
};

// ---------- Safe fetch with minimal backoff + Retry-After ----------
const safeFetch = async (
  url: string,
  options?: RequestInit,
  cfg: { retries?: number; backoffBaseMs?: number } = {}
) => {
  const retries = cfg.retries ?? 1;
  const base = cfg.backoffBaseMs ?? 900;

  const attempt = async (n: number): Promise<{ data: any; error: string | null }> => {
    try {
      const res = await fetch(url, options);

      if (res.status === 429) {
        const msg = await res.text().catch(() => "Rate limited");
        const retryAfter = res.headers.get("retry-after");
        console.warn(
          "Rate limited:",
          msg || "Too many requests",
          retryAfter ? `(Retry-After: ${retryAfter}s)` : ""
        );
        if (n < retries) {
          let waitMs = base * Math.pow(2, n) + Math.floor(Math.random() * 200);
          if (retryAfter) {
            const s = Number(retryAfter);
            if (!isNaN(s) && s >= 0) waitMs = Math.max(waitMs, s * 1000);
          }
          await new Promise((r) => setTimeout(r, waitMs));
          return attempt(n + 1);
        }
        return { data: null, error: "Server busy, try again later" };
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { data: null, error: json?.message || res.statusText || "Request failed" };
        }
        return { data: json, error: null };
      }

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        return { data: null, error: text || res.statusText || "Request failed" };
      }
      return { data: text, error: null };
    } catch (err: any) {
      if (n < retries) {
        const waitMs = base * Math.pow(2, n) + Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, waitMs));
        return attempt(n + 1);
      }
      return { data: null, error: err?.message || "Network error" };
    }
  };

  return attempt(0);
};

// ---------- Simple views queue (throttled) to reduce 429 ----------
type ViewItem = { postId: string; postType: "post" | "ad"; token?: string | null };
class ViewsQueue {
  private q: ViewItem[] = [];
  private processing = false;
  private intervalMs = 700; // adjust if still rate-limited

  enqueue(item: ViewItem) {
    this.q.push(item);
    this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.q.length) {
      const item = this.q.shift()!;
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/post-meta/${item.postId}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(item.token ? { Authorization: `Bearer ${item.token}` } : {}),
          },
          body: JSON.stringify({ postId: item.postId, postType: item.postType }),
        }).catch(() => {});
      } catch {}
      await new Promise((r) => setTimeout(r, this.intervalMs));
    }

    this.processing = false;
  }
}
const globalViewsQueue = new ViewsQueue();

// ---------- Report Modal ----------
interface ReportModalProps {
  postMetaId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  postMetaId,
  isOpen,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [extraDetails, setExtraDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  const reasons = [
    "Copyright infringement",
    "Spam or misleading",
    "Harassment or bullying",
    "Hate speech or symbols",
    "Misinformation",
    "Sexual content",
    "Violence or dangerous acts",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return alert("Please select a reason");

    try {
      setSubmitting(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/post-meta/${postMetaId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            reason: selectedReason,
            details: extraDetails.trim(),
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Report submitted successfully");
        onClose();
      } else {
        alert(data.message || "Failed to submit report");
      }
    } catch (err) {
      console.error("Error reporting post", err);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal__backdrop" onClick={onClose}>
      <div className="report-modal__content" onClick={(e) => e.stopPropagation()}>
        <button className="report-modal__close" onClick={onClose}>
          ✖
        </button>
        <h3 className="report-modal__title">Report Post</h3>
        <div className="report-modal__reasons">
          {reasons.map((r) => (
            <label key={r} className="report-modal__reason">
              <input
                type="radio"
                name="reportReason"
                value={r}
                checked={selectedReason === r}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="report-modal__radio"
              />
              {r}
            </label>
          ))}
        </div>
        <textarea
          className="report-modal__textarea"
          placeholder="Add more details (optional)..."
          value={extraDetails}
          onChange={(e) => setExtraDetails(e.target.value)}
          rows={3}
        />
        <button
          className="report-modal__submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </div>
  );
};

// ---------- PostFilesPreview Component ----------
interface PostFilesPreviewProps {
  files: FileItem[];
}

const PostFilesPreview: React.FC<PostFilesPreviewProps> = ({ files }) => {
  const images = files.filter((f) => f.type.startsWith("image"));
  const videos = files.filter((f) => f.type.startsWith("video"));
  const others = files.filter(
    (f) => !f.type.startsWith("image") && !f.type.startsWith("video")
  );

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <>
      {images.length === 1 && (
        <img
          src={images[0].url}
          alt={images[0].name || "image"}
          className="single-image-full"
          style={{ cursor: "pointer" }}
          onClick={() => {
            setIndex(0);
            setOpen(true);
          }}
        />
      )}

      {images.length > 1 && (
        <div className="image-preview-grid">
          {images.slice(0, 4).map((img, i) => (
            <div
              key={img._id || img.url || i}
              className="image-preview-item"
              onClick={() => {
                setIndex(i);
                setOpen(true);
              }}
            >
              <img src={img.url} alt={img.name || `image-${i + 1}`} />
              {i === 3 && images.length > 4 && (
                <div className="image-preview-overlay">+{images.length - 4}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="video-slider">
          {videos.map((vid, i) => (
            <video key={vid._id || vid.url || i} src={vid.url} controls className="file-preview-video" />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="other-files">
          {others.map((file, i) =>
            file.type === "pdf" ? (
              <a
                key={file._id || file.url || i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-preview-link"
              >
                📄 {file.name || "View PDF"}
              </a>
            ) : (
              <a key={file._id || file.url || i} href={file.url} download className="file-preview-link">
                📄 {file.name || "Download File"}
              </a>
            )
          )}
        </div>
      )}

      {open && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={index}
          slides={images.map((img) => ({
            src: img.url,
            title: img.name || "image",
          }))}
          plugins={[Thumbnails]}
        />
      )}
    </>
  );
};

// ---------- Feed Page ----------
export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // NEW: sort mode
  const [sortMode, setSortMode] = useState<"latest" | "trending">("trending");
  // if you want to expose window size, tweak here
  const TRENDING_WINDOW_HOURS = 48;
  const PAGE_SIZE = 20;

  const [followedAuthors, setFollowedAuthors] = useState<string[]>(() => {
    const saved = localStorage.getItem("followedAuthors");
    return saved ? JSON.parse(saved) : [];
  });
  const [likedPosts, setLikedPosts] = useState<string[]>(() => {
    const saved = localStorage.getItem("likedPosts");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedPosts, setSavedPosts] = useState<string[]>(() => {
    const saved = localStorage.getItem("savedPosts");
    return saved ? JSON.parse(saved) : [];
  });

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  // --- On mount or when sortMode changes: fetch feed & reconcile interactions ---
  useEffect(() => {
    const fetchFeed = async () => {
      // Build URL with trending or latest
      const params = new URLSearchParams();
      if (sortMode === "trending") {
        params.set("sort", "trending");
        params.set("windowHours", String(TRENDING_WINDOW_HOURS));
        params.set("page", "1");
        params.set("limit", String(PAGE_SIZE));
      } else {
        params.set("limit", String(PAGE_SIZE));
      }

      const url = `${import.meta.env.VITE_API_URL}/api/post-meta/feed${params.toString() ? `?${params.toString()}` : ""}`;

      const { data, error } = await safeFetch(
        url,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        { retries: 1 }
      );

      if (error || !data) {
        console.error("Failed to fetch feed:", error);
        return;
      }

      // Unified feed: posts + sponsored
      const feedItems: any[] = Array.isArray(data.feed) ? data.feed : [];

      // IMPORTANT: map "sponsored" to postType "ad"
      const cleaned: Post[] = feedItems
        .map((item: any) => ({
          ...item.data,
          postType: item.type === "ad" || item.type === "sponsored" ? "ad" : "post",
        }))
        .filter((meta: Post) => meta.status !== "deleted");

      // Deduplicate by postType+_id
      const unique = Array.from(
        new Map(cleaned.map((p) => [`${p.postType}-${p._id}`, p])).values()
      );

      setPosts(unique);
    };

    const fetchUserInteractions = async () => {
      if (!token) return;

      const { data, error } = await safeFetch(
        `${import.meta.env.VITE_API_URL}/api/user/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        { retries: 1 }
      );

      if (error || !data) {
        console.error("Failed to fetch user summary:", error);
        return;
      }

      // Likes (PostMeta)
      if (Array.isArray(data.likes?.postMeta)) {
        const likedIds = data.likes.postMeta.map((l: any) =>
          l.postMetaId.toString()
        );
        setLikedPosts(likedIds);
        localStorage.setItem("likedPosts", JSON.stringify(likedIds));
      }

      // Saves (PostMeta)
      if (Array.isArray(data.saves?.postMeta)) {
        const savedIds = data.saves.postMeta.map((s: any) =>
          s.postMetaId.toString()
        );
        setSavedPosts(savedIds);
        localStorage.setItem("savedPosts", JSON.stringify(savedIds));
      }

      // Following
      if (Array.isArray(data.following)) {
        const followingIds = data.following.map((f: any) =>
          f.following.toString()
        );
        setFollowedAuthors(followingIds);
        localStorage.setItem("followedAuthors", JSON.stringify(followingIds));
      }
    };

    // Small staggering to avoid burst on cold page load
    fetchFeed();
    setTimeout(fetchUserInteractions, 250);
  }, [token, sortMode]);

  // ---------- Slotting Logic ----------
  const injectAdsIntoFeed = (
    posts: Post[],
    ads: Post[],
    interval = 5,
    minOffset = 3 // kam se kam 3 posts ke baad hi ad inject hoga
  ): Post[] => {
    if (!ads.length) return posts;

    const merged: Post[] = [];
    let adIndex = 0;
    let lastAdInsertedAt = -interval;

    posts.forEach((post, i) => {
      merged.push(post);

      // Ad inject karne ka condition
      if (
        i >= minOffset &&
        (i + 1) % interval === 0 &&
        adIndex < ads.length &&
        i - lastAdInsertedAt >= interval
      ) {
        merged.push(ads[adIndex]);
        lastAdInsertedAt = i;
        adIndex++;
      }
    });

    // Agar extra ads bache hain
    while (adIndex < ads.length) {
      if (posts.length - lastAdInsertedAt >= interval) {
        merged.push(ads[adIndex]);
        lastAdInsertedAt = posts.length;
      }
      adIndex++;
    }

    return merged;
  };

  // --- Toggle follow ---
  const toggleFollow = async (authorId: string) => {
    if (!token || !authorId) return;
    const isFollowing = followedAuthors.includes(authorId);
    const endpoint = isFollowing ? "unfollow" : "follow";
    const bodyKey = isFollowing ? "userIdToUnfollow" : "userIdToFollow";

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [bodyKey]: authorId }),
      });

      if (res.ok) {
        const updated = isFollowing
          ? followedAuthors.filter((id) => id !== authorId)
          : [...followedAuthors, authorId];
        setFollowedAuthors(updated);
        localStorage.setItem("followedAuthors", JSON.stringify(updated));
      } else {
        const text = await res.text().catch(() => "");
        console.error(`Failed to ${endpoint}: ${text}`);
      }
    } catch (err) {
      console.error(`Error during ${endpoint}`, err);
    }
  };

  // ------------------ View Register (throttled queue) ------------------
  const viewedPostIds = useRef<Set<string>>(new Set());

  // Split posts and ads for base data
  const basePostsOnly = posts.filter((p) => p.postType === "post");
  const baseAdsOnly = posts.filter((p) => p.postType === "ad");

  const registerView = async (postId: string, postType: "post" | "ad" = "post") => {
    const uniqueKey = `${postType}-${postId}`;

    if (viewedPostIds.current.has(uniqueKey)) return;
    viewedPostIds.current.add(uniqueKey);

    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p._id === postId && p.postType === postType
          ? {
              ...p,
              stats: {
                ...p.stats,
                views: (p.stats?.views || 0) + 1,
              },
            }
          : p
      )
    );

    const token = localStorage.getItem("token");
    globalViewsQueue.enqueue({ postId, postType, token });
  };

  // ------------------ Optimistic Like Toggle ------------------
  const toggleLike = async (postId: string) => {
    if (!token) {
      alert("Please login to like posts.");
      return;
    }

    const isLiked = likedPosts.includes(postId);
    const prevLiked = [...likedPosts];

    // Optimistic update
    const updatedLiked = isLiked
      ? likedPosts.filter((id) => id !== postId)
      : [...likedPosts, postId];
    setLikedPosts(updatedLiked);
    localStorage.setItem("likedPosts", JSON.stringify(updatedLiked));
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p._id === postId
          ? {
              ...p,
              stats: {
                ...p.stats,
                likes: (p.stats?.likes || 0) + (isLiked ? -1 : 1),
              },
              isLikedByMe: !isLiked,
            }
          : p
      )
    );

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/post-meta/${postId}/like`,
        {
          method: isLiked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(isLiked ? {} : { body: JSON.stringify({ postId }) }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        setLikedPosts(prevLiked);
        localStorage.setItem("likedPosts", JSON.stringify(prevLiked));
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  stats: {
                    ...p.stats,
                    likes: (p.stats?.likes || 0) + (isLiked ? 1 : -1),
                  },
                  isLikedByMe: isLiked,
                }
              : p
          )
        );
        console.error(`Failed to ${isLiked ? "unlike" : "like"}:`, err);
        alert(`Could not ${isLiked ? "unlike" : "like"} post. Try again.`);
      } else {
        const data = await res.json().catch(() => null);
        if (data?.post) {
          setPosts((prevPosts) =>
            prevPosts.map((p) => (p._id === postId ? { ...p, ...data.post } : p))
          );
        }
      }
    } catch (err) {
      setLikedPosts(prevLiked);
      localStorage.setItem("likedPosts", JSON.stringify(prevLiked));
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId
            ? {
                ...p,
                stats: {
                  ...p.stats,
                  likes: (p.stats?.likes || 0) + (isLiked ? 1 : -1),
                },
                isLikedByMe: isLiked,
              }
            : p
        )
      );
      console.error(`Error during ${isLiked ? "unlike" : "like"}`, err);
      alert("Network error. Action not completed.");
    }
  };

  // ------------------ Optimistic Save Toggle ------------------
  const toggleSave = async (postId: string) => {
    if (!token) {
      alert("Please login to save posts.");
      return;
    }

    const isSaved = savedPosts.includes(postId);
    const prev = [...savedPosts];

    // Optimistic update
    const updated = isSaved
      ? savedPosts.filter((id) => id !== postId)
      : [...savedPosts, postId];
    setSavedPosts(updated);
    localStorage.setItem("savedPosts", JSON.stringify(updated));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/post-meta/${postId}/save`,
        {
          method: isSaved ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(isSaved ? {} : { body: JSON.stringify({ postId }) }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        if (err.message?.includes("Already saved")) {
          const forced = [...new Set([...prev, postId])];
          setSavedPosts(forced);
          localStorage.setItem("savedPosts", JSON.stringify(forced));
          return;
        }
        if (err.message?.includes("Already unsaved")) {
          const forced = prev.filter((id) => id !== postId);
          setSavedPosts(forced);
          localStorage.setItem("savedPosts", JSON.stringify(forced));
          return;
        }
        setSavedPosts(prev);
        localStorage.setItem("savedPosts", JSON.stringify(prev));
        console.error(`Failed to ${isSaved ? "unsave" : "save"}:`, err);
        alert(`Could not ${isSaved ? "unsave" : "save"} post. Try again.`);
      }
    } catch (err) {
      setSavedPosts(prev);
      localStorage.setItem("savedPosts", JSON.stringify(prev));
      console.error(`Error during ${isSaved ? "unsave" : "save"}`, err);
      alert("Network error. Action not completed.");
    }
  };

  // ------------------ Search ------------------
  const handleSearch = (query: string) => setSearchQuery(query);
  const isMobile = window.innerWidth <= 768;

  const filteredPosts = posts.filter((post) => {
    const q = searchQuery.trim().toLowerCase();
    const postText = contentToPlainText(post.content).toLowerCase();
    return (
      q === "" ||
      post.title?.toLowerCase().includes(q) ||
      post.description?.toLowerCase().includes(q) ||
      postText.includes(q)
    );
  });

  // Filter normal posts (ads ko search se ignore karna hoga)
  const filteredPostsOnly = filteredPosts.filter((p) => p.postType === "post");
  const filteredAdsOnly = filteredPosts.filter((p) => p.postType === "ad");
  const filteredSlottedFeed = injectAdsIntoFeed(filteredPostsOnly, filteredAdsOnly, 5);

  // ---------- Intersection Observer for All Posts ----------
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Reset view tracking for current session when posts change
    viewedPostIds.current = new Set();

    const observers: { [key: string]: IntersectionObserver } = {};

    filteredSlottedFeed.forEach((post) => {
      const uniqueKey = `${post.postType}-${post._id}`;
      const ref = postRefs.current[uniqueKey];
      if (!ref) return;

      observers[uniqueKey] = new window.IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            registerView(post._id, post.postType);
            observers[uniqueKey]?.disconnect();
          }
        },
        { threshold: 0.5 }
      );

      observers[uniqueKey].observe(ref);
    });

    return () => {
      Object.values(observers).forEach((obs) => obs.disconnect());
    };
    // eslint-disable-next-line
  }, [filteredSlottedFeed.map((p) => `${p.postType}-${p._id}`).join(",")]);

  // ------------------ SEO variables (dynamic) ------------------
  const siteOrigin =
    (import.meta as any).env?.VITE_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://gyaanmanthan.in");

  const canonicalUrl = searchQuery
    ? `${siteOrigin}/feed?search=${encodeURIComponent(searchQuery)}`
    : `${siteOrigin}/feed`;

  const pageTitle = searchQuery
    ? `Search "${searchQuery}" - GyaanManthan | India’s Knowledge Social Media`
    : `GyaanManthan Feed – India’s Knowledge & Gyaan Social Media`;

  const topText =
    filteredPostsOnly
      .slice(0, 3)
      .map((p) => [p.title, p.description].filter(Boolean).join(" — "))
      .join(" | ") ||
    "Discover and share gyaan, knowledge, facts and experiences on GyaanManthan.";

  const pageDescription =
    topText.length > 180 ? topText.slice(0, 179).trimEnd() + "…" : topText;

  const itemListElements = filteredPostsOnly.slice(0, 20).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${siteOrigin}/post-meta/${p._id}`,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: pageTitle,
        url: canonicalUrl,
        description: pageDescription,
        isPartOf: { "@type": "WebSite", name: "GyaanManthan", url: siteOrigin },
      },
      { "@type": "ItemList", itemListElement: itemListElements },
    ],
  };

  return (
    <div className="feed-page-wrapper">
      {/* SEO Head */}
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        robots={searchQuery ? "noindex,follow" : "index,follow"}
        openGraph={{
          title: pageTitle,
          description: pageDescription,
          url: canonicalUrl,
          type: "website",
          site_name: "GyaanManthan",
          image: `${siteOrigin}/og-image-1200x630.png`,
          imageWidth: 1200,
          imageHeight: 630,
          locale: "en_IN",
        }}
        twitter={{
          card: "summary_large_image",
          title: pageTitle,
          description: pageDescription,
          image: `${siteOrigin}/twitter-image-1200x600.png`,
          site: "@gyaanmanthan",
        }}
        jsonLd={jsonLd}
      />

      {/* NEW: Sort toggle */}
      <div className="feed-sort-row" style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 16px" }}>
        <span style={{ fontWeight: 600 }}>Sort:</span>
        <button
          className={`sort-chip ${sortMode === "latest" ? "active" : ""}`}
          onClick={() => setSortMode("latest")}
        >
          Latest
        </button>
        <button
          className={`sort-chip ${sortMode === "trending" ? "active" : ""}`}
          onClick={() => setSortMode("trending")}
        >
          Trending
        </button>
      </div>

      <div className="feed-filters-area">
        <PostFilters onSearch={handleSearch} />
      </div>

      <div className="feed-scroll-area">
        <div className="feed-card-list">
          {filteredSlottedFeed.length > 0 ? (
            filteredSlottedFeed.map((post, idx) => {
              const isLiked = likedPosts.includes(post._id);
              const isSaved = savedPosts.includes(post._id);
              const uniqueKey = `${post.postType}-${post._id}`;

              // ---------- Ad Card (Sponsored/Private Ads) ----------
              if (post.postType === "ad") {
                return (
                  <React.Fragment key={uniqueKey}>
                    <article
                      className="ad-card"
                      ref={(el: HTMLDivElement | null) => {
                        postRefs.current[uniqueKey] = el;
                      }}
                    >
                      {post.files?.[0]?.url && (
                        <img
                          src={post.files[0].url}
                          alt={post.title || "Advertisement"}
                          className="ad-image"
                        />
                      )}
                      <div className="ad-content">
                        <h3 className="ad-title">{post.title}</h3>
                        {post.description && (
                          <p className="ad-description">{post.description}</p>
                        )}

                        {(post.ctaText || post.ctaUrl) && (
                          <a
                            href={post.ctaUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="ad-cta-btn"
                          >
                            {post.ctaText || "Visit"}
                          </a>
                        )}

                        <div className="ad-stats">
                          <span>👁 {post.stats?.views ?? 0}</span>
                          <span>❤️ {post.stats?.likes ?? 0}</span>
                          <span>🖱 {post.stats?.clicks ?? 0}</span>
                        </div>
                      </div>
                    </article>

                    {/* Google Ad every 4th post */}
                    {idx > 0 && idx % 4 === 0 && <AdSlot key={`ad-${idx}`} />}
                  </React.Fragment>
                );
              }

              // ---------- Normal Post Card ----------
              return (
                <React.Fragment key={uniqueKey}>
                  <article
                    className="tweet-card"
                    ref={(el: HTMLDivElement | null) => {
                      postRefs.current[uniqueKey] = el;
                    }}
                  >
                    <div className="tweet-header">
                      {(post.authorAvatar || post?.author?.avatarUrl) && (
                        <img
                          src={post.authorAvatar || post.author?.avatarUrl}
                          alt={post.authorName || post.author?.name || "Unknown"}
                          className="author-dp"
                        />
                      )}
                      <div className="author-row">
                        <div className="author-info">
                          <div className="author-top">
                            <span className="tweet-author">
                              {post.authorName || post.author?.name || "Unknown"}
                            </span>
                            {(post.isGoldenVerified || post.author?.isGoldenVerified) && (
                              <img
                                src="/golden-tick.png"
                                alt="Golden Verified"
                                className="golden-tick-icon"
                                title="Golden Verified"
                              />
                            )}
                          </div>
                          <div className="author-subline">
                            <span className="author-username">
                              @{post.authorUsername || post.author?.username || "unknown"}
                            </span>
                            <span className="post-date">
                              {post.createdAt
                                ? ` • ${new Date(post.createdAt).toLocaleDateString()}`
                                : ""}
                            </span>
                          </div>
                        </div>
                        {post.authorId !== currentUserId && (
                          <button
                            className={`follow-btn ${
                              followedAuthors.includes(post.authorId || "") ? "following" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (post.authorId) toggleFollow(post.authorId);
                            }}
                          >
                            {followedAuthors.includes(post.authorId || "") ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>
                    </div>

                    {post.title && <h3 className="tweet-title">{post.title}</h3>}
                    {post.description && <p className="tweet-excerpt">{post.description}</p>}

                    {/* Files Preview */}
                    {post.files?.length ? (
                      <div className="tweet-files">
                        <PostFilesPreview files={post.files} />
                      </div>
                    ) : null}

                    {/* Optional CTA for posts if needed */}
                    {(post.ctaText || post.ctaUrl) && (
                      <div className="ad-cta-wrapper">
                        <a
                          href={post.ctaUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="ad-cta-btn"
                        >
                          {post.ctaText || "Visit"}
                        </a>
                      </div>
                    )}

                    <div className="tweet-actions">
                      {/* Like */}
                      <button
                        className={`icon-btn like-btn ${
                          post.isLikedByMe || isLiked ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(post._id);
                        }}
                        aria-label="Like"
                      >
                        {post.isLikedByMe || isLiked ? (
                          <HeartIconSolid className="icon active-icon" />
                        ) : (
                          <HeartIconOutline className="icon" />
                        )}
                        <span className="count">{post.stats?.likes ?? 0}</span>
                      </button>

                      {/* Save */}
                      <button
                        className={`icon-btn save-btn ${isSaved ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(post._id);
                        }}
                        aria-label="Save"
                      >
                        {isSaved ? (
                          <BookmarkIconSolid className="icon active-icon" />
                        ) : (
                          <BookmarkIconOutline className="icon" />
                        )}
                      </button>

                      {/* Share */}
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                          setIsShareOpen(true);
                        }}
                        aria-label="Share"
                      >
                        <ShareIcon className="icon" />
                      </button>

                      {/* Comment */}
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                          setIsCommentsOpen(true);
                        }}
                        aria-label="Comment"
                      >
                        <ChatBubbleOvalLeftIcon className="icon" />
                      </button>

                      {/* Views */}
                      <button className="icon-btn" disabled>
                        <ChartBarIcon className="icon" />
                        <span className="count">{post.stats?.views ?? 0}</span>
                      </button>

                      {/* Report */}
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPost(post);
                          setIsReportOpen(true);
                        }}
                        aria-label="Report"
                      >
                        <FlagIcon className="icon" />
                      </button>
                    </div>
                  </article>

                  {/* Google Ad every 4th post */}
                  {idx > 0 && idx % 4 === 0 && <AdSlot />}
                </React.Fragment>
              );
            })
          ) : (
            <p className="no-posts">No posts found for your search.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedPost && isCommentsOpen && selectedPost.authorId && (
        <CommentsModal
          postMetaId={selectedPost._id}
          postMetaAuthorId={selectedPost.authorId}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
        />
      )}
      {selectedPost && isShareOpen && (
        <ShareModal
          url={`${window.location.origin}/post-meta/${selectedPost._id}`}
          title={selectedPost.title}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
      {selectedPost && isReportOpen && (
        <ReportModal
          postMetaId={selectedPost._id}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}