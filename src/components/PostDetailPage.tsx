import React, { useState, useEffect, useRef } from "react";
import SEO from "../components/SEO";
import CommentsModal from "../components/CommentsModal";
import { renderContent } from "../utils/renderContent";
import ShareModal from "../components/ShareModal";
import "./PostDetailPage.css";
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

// ---------- AD INTERFACE ----------
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

// ---------- Interfaces ----------
interface Author {
  _id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  isGoldenVerified?: boolean;
}

interface Post {
  _id: string;
  url?: string;
  title: string;
  description?: string;
  content: any;
  author?: Author;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  isGoldenVerified?: boolean;
  images?: string[];
  tags?: string[];
  category?: string;
  createdAt?: string;
  status?: string;
  stats?: {
    views: number;
    likes: number;
    saves: number;
    comments: number;
    shares: number;
    reports: number;
  };
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

// ---------- Safe fetch (429-aware, content-type aware) ----------
const safeFetch = async (url: string, options?: RequestInit, retries = 1) => {
  const attempt = async (n: number): Promise<{ data: any; error: string | null; headers?: Headers; status?: number }> => {
    try {
      const res = await fetch(url, options);

      if (res.status === 429) {
        const text = await res.text().catch(() => "Too many requests");
        const retryAfter = res.headers.get("retry-after");
        console.warn("Rate limited:", text);
        if (n < retries) {
          let waitMs = 900 * Math.pow(2, n) + Math.floor(Math.random() * 200);
          if (retryAfter) {
            const s = Number(retryAfter);
            if (!isNaN(s) && s >= 0) waitMs = Math.max(waitMs, s * 1000);
          }
          await new Promise((r) => setTimeout(r, waitMs));
          return attempt(n + 1);
        }
        return { data: null, error: "Server busy, try again later", headers: res.headers, status: res.status };
      }

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return { data: null, error: json?.message || res.statusText || "Request failed", headers: res.headers, status: res.status };
        return { data: json, error: null, headers: res.headers, status: res.status };
      } else {
        const text = await res.text().catch(() => "");
        if (!res.ok) return { data: null, error: text || res.statusText || "Request failed", headers: res.headers, status: res.status };
        return { data: text, error: null, headers: res.headers, status: res.status };
      }
    } catch (err: any) {
      if (n < retries) {
        const waitMs = 900 * Math.pow(2, n) + Math.floor(Math.random() * 200);
        await new Promise((r) => setTimeout(r, waitMs));
        return attempt(n + 1);
      }
      return { data: null, error: err?.message || "Network error" };
    }
  };
  return attempt(0);
};

// ---------- Tiny TTL cache ----------
const getCachedJSON = <T = any,>(key: string, ttlMs: number): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.value as T;
  } catch {
    return null;
  }
};
const setCachedJSON = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), value }));
  } catch {}
};


// ---------- Report Modal ----------
interface ReportModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ postId, isOpen, onClose }) => {
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
    if (!selectedReason) {
      alert("Please select a reason");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/report`,
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
      <div
        className="report-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
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

type AdsBannerProps = { slot?: number }; // parent se slot pass hoga: 0,1,2...

const AdsBanner: React.FC<AdsBannerProps> = ({ slot = 0 }) => {
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAds = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/ads`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json().catch(() => ({}));
        setAds(Array.isArray((data as any).ads) ? (data as any).ads : []);
      } catch (err) {
        setErrorMsg("");
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  const handleClick = async (ad: Ad) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
       `${import.meta.env.VITE_API_URL}/api/ads/${ad._id}/click`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json().catch(() => ({}));
      const url = (data as any).redirect || ad.ctaUrl;
      if (url) window.open(url, "_blank");
    } catch {}
  };

  if (loading) return <div className="ads-banner"></div>;
  if (errorMsg) return <div className="ads-banner error">{errorMsg}</div>;
  if (!ads.length) return null;

  // pick one ad based on slot (so each ad slot shows next creative)
  const ad = ads[slot % ads.length];

  return (
    <div className="ads-banner">
      <div className="ad-card">
        <h3 className="ad-card-title">{ad.title}</h3>
        {ad.description && <p className="ad-card-body">{ad.description}</p>}

        {ad.files?.map((file, fi) =>
          file.type?.startsWith("image") ? (
            <img
              key={fi}
              src={file.url}
              alt={ad.title}
              className="ad-card-image"
            />
          ) : (
            <p key={fi}>
              📄{" "}
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {file.name || "View File"}
              </a>
            </p>
          )
        )}

        <button onClick={() => handleClick(ad)} className="ad-card-button">
          {ad.ctaText || "Visit"}
        </button>

        <div className="ad-card-stats-row">
          <div className="ad-card-stats">
            <strong>Views:</strong> {ad.stats?.views || 0} |{" "}
            <strong>Clicks:</strong> {ad.stats?.clicks || 0}
          </div>
          <span className="ad-badge">Ad</span>
        </div>
      </div>
    </div>
  );
};

// ---------- PostDetailPage ----------
export default function PostDetailPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostAuthorId, setSelectedPostAuthorId] = useState<string | null>(null);
  const [sharePostUrl, setSharePostUrl] = useState<string | null>(null);
  const [sharePostTitle, setSharePostTitle] = useState<string | null>(null);

  const [likedPosts, setLikedPosts] = useState<string[]>(() => {
    const saved = localStorage.getItem("likedPosts");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedPosts, setSavedPosts] = useState<string[]>(() => {
    const saved = localStorage.getItem("savedPosts");
    return saved ? JSON.parse(saved) : [];
  });
  const [followedAuthors, setFollowedAuthors] = useState<string[]>(() => {
    const saved = localStorage.getItem("followedAuthors");
    return saved ? JSON.parse(saved) : [];
  });

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  // --------------- View Logic ---------------
  // Store already viewed post ids in a Set to avoid duplicate "view" for same session
  const viewedPostIds = useRef<Set<string>>(new Set());

  // Register view API call (FeedPage-style via /api/post-meta/:id/view), throttled
  const registerView = async (postId: string) => {
    if (viewedPostIds.current.has(postId)) return;
    viewedPostIds.current.add(postId);

    // Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p._id === postId
          ? {
              ...p,
              stats: {
                ...p.stats,
                views: (p.stats?.views ?? 0) + 1,
                likes: p.stats?.likes ?? 0,
                saves: p.stats?.saves ?? 0,
                comments: p.stats?.comments ?? 0,
                shares: p.stats?.shares ?? 0,
                reports: p.stats?.reports ?? 0,
              },
            }
          : p
      )
    );
  };

  const handleOpenComments = (postId: string, authorId: string) => {
    setSelectedPostId(postId);
    setSelectedPostAuthorId(authorId);
  };

  const handleOpenShare = (url: string, title: string) => {
    setSharePostUrl(url);
    setSharePostTitle(title);
  };

  // ------------------ Fetch Posts & User Interactions (with safeFetch + TTL cache) ------------------
  useEffect(() => {
    let isMounted = true;

    const loadFromCacheFirst = () => {
      // Posts cache (15s)
      const cachedFeed = getCachedJSON<any>("postsFeed", 15_000);
      if (cachedFeed?.feed && Array.isArray(cachedFeed.feed)) {
        const postItems = cachedFeed.feed
          .filter((item: any) => item.type === "post")
          .map((item: any) => {
            const postId = item.data._id.toString();
            return {
              ...item.data,
              url: `https://gyaanmanthan.in/post/${postId}`,
              isLikedByMe: likedPosts.includes(postId),
              isSavedByMe: savedPosts.includes(postId),
            } as Post;
          });
        if (isMounted) setPosts(postItems);
      }

      // User summary cache (60s)
      const cachedSummary = getCachedJSON<any>("userSummary", 60_000);
      if (cachedSummary) {
        if (Array.isArray(cachedSummary.likes?.postMeta)) {
          const likedIds = cachedSummary.likes.postMeta.map((l: any) => l.postMetaId.toString());
          setLikedPosts(likedIds);
          localStorage.setItem("likedPosts", JSON.stringify(likedIds));
        }
        if (Array.isArray(cachedSummary.saves?.postMeta)) {
          const savedIds = cachedSummary.saves.postMeta.map((s: any) => s.postMetaId.toString());
          setSavedPosts(savedIds);
          localStorage.setItem("savedPosts", JSON.stringify(savedIds));
        }
        if (Array.isArray(cachedSummary.following)) {
          const followingIds = cachedSummary.following.map((f: any) => f.following.toString());
          setFollowedAuthors(followingIds);
          localStorage.setItem("followedAuthors", JSON.stringify(followingIds));
        }
      }
    };

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      // Use posts feed
      const { data, error } = await safeFetch(
        `${import.meta.env.VITE_API_URL}/api/posts/feed`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        1
      );

      if (!isMounted) return;

      if (error || !data) {
        setError(error || "Failed to fetch posts");
      } else {
        setCachedJSON("postsFeed", data);
        const postItems = (data.feed || [])
          .filter((item: any) => item.type === "post")
          .map((item: any) => {
            const postId = item.data._id.toString();
            return {
              ...item.data,
              url: `https://gyaanmanthan.in/post/${postId}`,
              isLikedByMe: likedPosts.includes(postId),
              isSavedByMe: savedPosts.includes(postId),
            } as Post;
          });
        setPosts(postItems);
      }

      setLoading(false);
    };

    const fetchUserInteractions = async () => {
      if (!token) return;

      const { data, error } = await safeFetch(
        `${import.meta.env.VITE_API_URL}/api/user/summary`,
        { headers: { Authorization: `Bearer ${token}` } },
        1
      );

      if (error || !data) {
        console.error("Error fetching user interactions", error);
        return;
      }

      setCachedJSON("userSummary", data);

      // Likes (PostMeta)
      if (Array.isArray(data.likes?.postMeta)) {
        const likedIds = data.likes.postMeta.map((l: any) => l.postMetaId.toString());
        setLikedPosts(likedIds);
        localStorage.setItem("likedPosts", JSON.stringify(likedIds));
      }
      // Saves (PostMeta)
      if (Array.isArray(data.saves?.postMeta)) {
        const savedIds = data.saves.postMeta.map((s: any) => s.postMetaId.toString());
        setSavedPosts(savedIds);
        localStorage.setItem("savedPosts", JSON.stringify(savedIds));
      }
      // Following
      if (Array.isArray(data.following)) {
        const followingIds = data.following.map((f: any) => f.following.toString());
        setFollowedAuthors(followingIds);
        localStorage.setItem("followedAuthors", JSON.stringify(followingIds));
      }
    };

    // 1) Preload from cache to avoid blank UI + reduce calls on reloads
    loadFromCacheFirst();
    // 2) Stagger network to avoid burst on free tier
    fetchPosts();
    setTimeout(fetchUserInteractions, 300);

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line
  }, [token]);

  // Update posts' liked/saved state when likedPosts/savedPosts change
  useEffect(() => {
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        isLikedByMe: likedPosts.includes(p._id),
        isSavedByMe: savedPosts.includes(p._id),
      }))
    );
  }, [likedPosts, savedPosts]);

  // ------------------ View observer ------------------
  const postRefs = useRef<{ [id: string]: HTMLElement | null }>({});
  useEffect(() => {
    viewedPostIds.current = new Set();

    const observers: { [id: string]: IntersectionObserver } = {};
    posts.forEach((post) => {
      const ref = postRefs.current[post._id];
      if (!ref) return;
      observers[post._id] = new window.IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            registerView(post._id);
            observers[post._id]?.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      observers[post._id].observe(ref);
    });

    return () => {
      Object.values(observers).forEach((obs) => obs.disconnect());
    };
    // eslint-disable-next-line
  }, [posts.map((p) => p._id).join(",")]);

  // ------------------ Toggle Like (FeedPage-style endpoints) ------------------
  const toggleLike = async (postId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to like posts.");

    const isLiked = likedPosts.includes(postId);
    const prevLiked = [...likedPosts];

    // Optimistic update
    const updatedLiked = isLiked ? likedPosts.filter((id) => id !== postId) : [...likedPosts, postId];
    setLikedPosts(updatedLiked);
    localStorage.setItem("likedPosts", JSON.stringify(updatedLiked));
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLikedByMe: !isLiked,
              stats: {
                views: p.stats?.views ?? 0,
                likes: (p.stats?.likes ?? 0) + (isLiked ? -1 : 1),
                saves: p.stats?.saves ?? 0,
                comments: p.stats?.comments ?? 0,
                shares: p.stats?.shares ?? 0,
                reports: p.stats?.reports ?? 0,
              },
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
        // rollback
        setLikedPosts(prevLiked);
        localStorage.setItem("likedPosts", JSON.stringify(prevLiked));
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  isLikedByMe: isLiked,
                  stats: {
                    views: p.stats?.views ?? 0,
                    likes: (p.stats?.likes ?? 0) + (isLiked ? 1 : -1),
                    saves: p.stats?.saves ?? 0,
                    comments: p.stats?.comments ?? 0,
                    shares: p.stats?.shares ?? 0,
                    reports: p.stats?.reports ?? 0,
                  },
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
      // rollback on network error
      setLikedPosts(prevLiked);
      localStorage.setItem("likedPosts", JSON.stringify(prevLiked));
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId
            ? {
                ...p,
                isLikedByMe: isLiked,
                stats: {
                  views: p.stats?.views ?? 0,
                  likes: (p.stats?.likes ?? 0) + (isLiked ? 1 : -1),
                  saves: p.stats?.saves ?? 0,
                  comments: p.stats?.comments ?? 0,
                  shares: p.stats?.shares ?? 0,
                  reports: p.stats?.reports ?? 0,
                },
              }
            : p
        )
      );
      console.error(`Error during ${isLiked ? "unlike" : "like"}`, err);
      alert("Network error. Action not completed.");
    }
  };

  // ------------------ Toggle Save (FeedPage-style + special messages) ------------------
  const toggleSave = async (postId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to save posts.");

    const isSaved = savedPosts.includes(postId);
    const prev = [...savedPosts];

    // Optimistic update
    const updated = isSaved ? savedPosts.filter((id) => id !== postId) : [...savedPosts, postId];
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

  // ------------------ Toggle Follow ------------------
  const toggleFollow = async (authorId: string) => {
    const token = localStorage.getItem("token");
    if (!token || !authorId) return;
    const isFollowing = followedAuthors.includes(authorId);
    const endpoint = isFollowing ? "unfollow" : "follow";
    const bodyKey = isFollowing ? "userIdToUnfollow" : "userIdToFollow";

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [bodyKey]: authorId }),
        }
      );
      if (res.ok) {
        const updated = isFollowing
          ? followedAuthors.filter((id) => id !== authorId)
          : [...followedAuthors, authorId];
        setFollowedAuthors(updated);
        localStorage.setItem("followedAuthors", JSON.stringify(updated));
      }
    } catch {}
  };

  // ------------------ SEO variables (dynamic for this page) ------------------
  const siteOrigin =
    (import.meta as any).env?.VITE_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://gyaanmanthan.in");

  // For list page, canonical can be current URL; fallback to /posts
  const canonicalUrl =
    typeof window !== "undefined" ? window.location.href : `${siteOrigin}/posts`;

  const pageTitle = "Latest Posts – GyaanManthan | India’s Knowledge Social Media";

  const topText =
    posts
      .slice(0, 3)
      .map((p) => [p.title, p.description].filter(Boolean).join(" — "))
      .join(" | ") ||
    "Read, discover and share gyaan, knowledge, facts and experiences on GyaanManthan.";

  const pageDescription =
    topText.length > 180 ? topText.slice(0, 179).trimEnd() + "…" : topText;

  const itemListElements = posts.slice(0, 20).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${siteOrigin}/post/${p._id}`,
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

  if (loading) {
    return (
      <>
        <SEO
          title={pageTitle}
          description={pageDescription}
          canonical={canonicalUrl}
          robots="index,follow"
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
        <p className="status-message">Loading posts...</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title={pageTitle}
          description={pageDescription}
          canonical={canonicalUrl}
          robots="noindex,follow"
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
        <p className="status-message error-message">{error}</p>
      </>
    );
  }

  return (
    <div className="page-container">
      {/* SEO Head */}
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        robots="index,follow"
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

      {/* ---- Ads Banner at the Top ---- */}
      <AdsBanner />

      <main className="posts-container">
        {posts.length === 0 ? (
          <p className="status-message">No posts found</p>
        ) : (
          posts.map((post, idx) => {
            const isLiked = post.isLikedByMe ?? likedPosts.includes(post._id);
            const isSaved = post.isSavedByMe ?? savedPosts.includes(post._id);
            const isFollowing = followedAuthors.includes(post.authorId || "");
            const isAdSlot = (idx + 1) % 5 === 0;
            const slot = Math.floor((idx + 1) / 5) - 1;

            return (
              <React.Fragment key={post._id}>
                {isAdSlot && <AdsBanner slot={slot} />}

                <article
                  className="post-card"
                  ref={(el) => {
                    postRefs.current[post._id] = el;
                  }}
                >
                  {/* Author + Date */}
                  <div className="post-meta">
                    {(post.authorAvatar || post.author?.avatarUrl) && (
                      <img
                        src={post.authorAvatar || post.author?.avatarUrl}
                        alt={post.authorName || post.author?.name || "Unknown"}
                        className="author-dp"
                      />
                    )}

                    <div className="author-info">
                      <div className="author-name-line">
                        <span className="author-name">
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
                        className={`follow-btn ${isFollowing ? "following" : ""}`}
                        onClick={() => post.authorId && toggleFollow(post.authorId)}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>

                  {/* Main Image */}
                  {post.images?.[0] && (
                    <div className="post-image">
                      <img src={post.images[0]} alt={post.title} />
                    </div>
                  )}

                  {/* Title & Description */}
                  <h3 className="post-title">{post.title}</h3>
                  {post.description && <p className="post-description">{post.description}</p>}
                  <div className="post-body">{renderContent(post.content)}</div>

                  {/* Actions */}
                  <div className="post-actions">
                    {/* Comment Button (modal open) */}
                    <input
                      type="text"
                      className="comment"
                      placeholder="Add a comment..."
                      onFocus={() =>
                        handleOpenComments(
                          post._id,
                          post.authorId || post.author?._id || ""
                        )
                      }
                    />

                    {/* Save */}
                    <button
                      className={`icon-btn ${isSaved ? "active" : ""}`}
                      onClick={() => toggleSave(post._id)}
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

                    {/* Report */}
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setSelectedPostId(post._id);
                        setIsReportOpen(true);
                      }}
                      aria-label="Report"
                    >
                      <FlagIcon className="icon" />
                    </button>
                  </div>
                </article>
              </React.Fragment>
            );
          })
        )}
      </main>

      {/* Comments Modal */}
      {selectedPostId && selectedPostAuthorId && (
        <CommentsModal
          postId={selectedPostId}
          postAuthorId={selectedPostAuthorId}
          isOpen={!!selectedPostId}
          onClose={() => {
            setSelectedPostId(null);
            setSelectedPostAuthorId(null);
          }}
        />
      )}

      {/* Share Modal */}
      {selectedPost && isShareOpen && (
        <ShareModal
          url={`${window.location.origin}/post/${selectedPost._id}`}
          title={selectedPost.title}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {selectedPostId && isReportOpen && (
        <ReportModal
          postId={selectedPostId}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}