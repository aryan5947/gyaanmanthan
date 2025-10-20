import React, { useState, useEffect, useRef } from "react";
import SEO from "../components/SEO";
import CommentsModal from "./CommentsModal";
import { renderContent } from "../utils/renderContent";
import { useParams } from "react-router-dom";
import ShareModal from "../components/ShareModal";
import "../components/PostDetailPage.css";
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

interface Stats {
  views: number;
  likes: number;
  saves: number;
  comments: number;
  shares: number;
  reports: number;
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
  stats?: Stats;
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
}

// ---------- Utility: Always return stats with all fields as number ----------
function getStats(stats?: Stats): Stats {
  return {
    views: typeof stats?.views === "number" ? stats.views : 0,
    likes: typeof stats?.likes === "number" ? stats.likes : 0,
    saves: typeof stats?.saves === "number" ? stats.saves : 0,
    comments: typeof stats?.comments === "number" ? stats.comments : 0,
    shares: typeof stats?.shares === "number" ? stats.shares : 0,
    reports: typeof stats?.reports === "number" ? stats.reports : 0,
  };
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

const contentToPlainText = (content: any): string =>
  normalizeContent(content)
    .map((block: any) =>
      Array.isArray(block?.children)
        ? block.children.map((c: any) => c?.text || "").join("")
        : ""
    )
    .join(" ")
    .trim();

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

      const data = await res.json();
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

// ---------- PostDetail ----------
export default function PostDetail() {
  const [post, setPost] = useState<Post | null>(null);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
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

  // --------------- View Logic ---------------
  const viewedPostIds = useRef<Set<string>>(new Set());

  const registerView = async (postId: string) => {
    if (viewedPostIds.current.has(postId)) return;
    viewedPostIds.current.add(postId);

    // Optimistic update
    setPost((prevPost) =>
      prevPost && prevPost._id === postId
        ? {
            ...prevPost,
            stats: {
              ...getStats(prevPost.stats),
              views: getStats(prevPost.stats).views + 1,
            },
          }
        : prevPost
    );

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/view`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ postId }),
        }
      );

      if (!res.ok) {
        // Rollback
        setPost((prevPost) =>
          prevPost && prevPost._id === postId
            ? {
                ...prevPost,
                stats: {
                  ...getStats(prevPost.stats),
                  views: Math.max(getStats(prevPost.stats).views - 1, 0),
                },
              }
            : prevPost
        );
        viewedPostIds.current.delete(postId);
      } else {
        const data = await res.json().catch(() => null);
        if (data?.views !== undefined) {
          setPost((prevPost) =>
            prevPost && prevPost._id === postId
              ? {
                  ...prevPost,
                  stats: {
                    ...getStats(prevPost.stats),
                    views: data.views,
                  },
                }
              : prevPost
          );
        }
      }
    } catch {
      setPost((prevPost) =>
        prevPost && prevPost._id === postId
          ? {
              ...prevPost,
              stats: {
                ...getStats(prevPost.stats),
                views: Math.max(getStats(prevPost.stats).views - 1, 0),
              },
            }
          : prevPost
      );
      viewedPostIds.current.delete(postId);
    }
  };

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const handleOpenComments = (postId: string, authorId: string) => {
    setSelectedPostId(postId);
    setSelectedPostAuthorId(authorId);
  };

  const handleOpenShare = (url: string, title: string) => {
    setSharePostUrl(url);
    setSharePostTitle(title);
  };

  // ------------------ Fetch Posts & User Interactions ------------------
  useEffect(() => {
    let isMounted = true;
    const postsController = new AbortController();
    const interactionsController = new AbortController();

    let didFetchPosts = false;
    let didFetchInteractions = false;

    const fetchUserInteractions = async () => {
      if (!token || didFetchInteractions) return;
      didFetchInteractions = true;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/user/summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: interactionsController.signal,
          }
        );

        if (!res.ok) return;
        const data = await res.json();

        if (Array.isArray(data.likes?.postMeta)) {
          const likedIds = data.likes.postMeta.map((l: any) =>
            l.postMetaId.toString()
          );
          setLikedPosts(likedIds);
          localStorage.setItem("likedPosts", JSON.stringify(likedIds));
        }
        if (Array.isArray(data.saves?.postMeta)) {
          const savedIds = data.saves.postMeta.map((s: any) =>
            s.postMetaId.toString()
          );
          setSavedPosts(savedIds);
          localStorage.setItem("savedPosts", JSON.stringify(savedIds));
        }
        if (Array.isArray(data.following)) {
          const followingIds = data.following.map((f: any) =>
            f.following.toString()
          );
          setFollowedAuthors(followingIds);
          localStorage.setItem("followedAuthors", JSON.stringify(followingIds));
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching user interactions", err);
        }
      }
    };

    const fetchPost = async () => {
      if (didFetchPosts) return;
      didFetchPosts = true;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/posts/${id}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: postsController.signal,
          }
        );

        const data = await res.json();
        if (!isMounted) return;

        if (res.ok) {
          let postData: any = null;
          if (Array.isArray(data.feed)) {
            const postItem = data.feed.find((item: any) => item.type === "post");
            if (postItem) postData = postItem.data;
          } else if (typeof data === "object" && data._id) {
            postData = data;
          }

          if (postData) {
            const postId = postData._id.toString();
            setPost({
              ...postData,
              url: `https://gyaanmanthan.in/post/${postId}`,
              isLikedByMe: likedPosts.includes(postId),
              isSavedByMe: savedPosts.includes(postId),
              stats: getStats(postData.stats),
            });
          } else {
            setPost(null);
            setError("No post found");
          }
        } else {
          setError(data.message || "Failed to fetch post");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError("Something went wrong");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Pehle interactions, fir post
    fetchUserInteractions().then(fetchPost);

    return () => {
      isMounted = false;
      postsController.abort();
      interactionsController.abort();
    };
    // eslint-disable-next-line
  }, [token, id]);

  // Update post's liked/saved state when likedPosts/savedPosts change
  useEffect(() => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            isLikedByMe: likedPosts.includes(prev._id),
            isSavedByMe: savedPosts.includes(prev._id),
          }
        : prev
    );
  }, [likedPosts, savedPosts]);

  // ------------------ View observer ------------------
  const postRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    viewedPostIds.current = new Set();

    if (post && postRef.current) {
      const observer = new window.IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            registerView(post._id);
            observer.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(postRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [post?._id]);

  // ------------------ Toggle Like ------------------
  const toggleLike = async (postId: string) => {
    if (!token) return alert("Please login to like posts.");

    const isLiked = likedPosts.includes(postId);
    const prev = [...likedPosts];
    const updated = isLiked
      ? likedPosts.filter((id) => id !== postId)
      : [...likedPosts, postId];

    setLikedPosts(updated);
    localStorage.setItem("likedPosts", JSON.stringify(updated));

    setPost((prevPost) =>
      prevPost && prevPost._id === postId
        ? {
            ...prevPost,
            isLikedByMe: !isLiked,
            stats: {
              ...getStats(prevPost.stats),
              likes: getStats(prevPost.stats).likes + (isLiked ? -1 : 1),
            },
          }
        : prevPost
    );

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`,
        {
          method: isLiked ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        setLikedPosts(prev);
        localStorage.setItem("likedPosts", JSON.stringify(prev));
        setPost((prevPost) =>
          prevPost && prevPost._id === postId
            ? {
                ...prevPost,
                isLikedByMe: isLiked,
                stats: {
                  ...getStats(prevPost.stats),
                  likes: getStats(prevPost.stats).likes + (isLiked ? 1 : -1),
                },
              }
            : prevPost
        );
      }
    } catch (err) {
      setLikedPosts(prev);
      localStorage.setItem("likedPosts", JSON.stringify(prev));
      setPost((prevPost) =>
        prevPost && prevPost._id === postId
          ? {
              ...prevPost,
              isLikedByMe: isLiked,
              stats: {
                ...getStats(prevPost.stats),
                likes: getStats(prevPost.stats).likes + (isLiked ? 1 : -1),
              },
            }
          : prevPost
      );
    }
  };

  // ------------------ Toggle Save ------------------
  const toggleSave = async (postId: string) => {
    if (!token) return alert("Please login to save posts.");

    const isSaved = savedPosts.includes(postId);
    const prev = [...savedPosts];
    const updated = isSaved
      ? savedPosts.filter((id) => id !== postId)
      : [...savedPosts, postId];

    setSavedPosts(updated);
    localStorage.setItem("savedPosts", JSON.stringify(updated));

    setPost((prevPost) =>
      prevPost && prevPost._id === postId
        ? {
            ...prevPost,
            isSavedByMe: !isSaved,
            stats: {
              ...getStats(prevPost.stats),
              saves: getStats(prevPost.stats).saves + (isSaved ? -1 : 1),
            },
          }
        : prevPost
    );

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/save`,
        {
          method: isSaved ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        setSavedPosts(prev);
        localStorage.setItem("savedPosts", JSON.stringify(prev));
        setPost((prevPost) =>
          prevPost && prevPost._id === postId
            ? {
                ...prevPost,
                isSavedByMe: isSaved,
                stats: {
                  ...getStats(prevPost.stats),
                  saves: getStats(prevPost.stats).saves + (isSaved ? 1 : -1),
                },
              }
            : prevPost
        );
      }
    } catch (err) {
      setSavedPosts(prev);
      localStorage.setItem("savedPosts", JSON.stringify(prev));
      setPost((prevPost) =>
        prevPost && prevPost._id === postId
          ? {
              ...prevPost,
              isSavedByMe: isSaved,
              stats: {
                ...getStats(prevPost.stats),
                saves: getStats(prevPost.stats).saves + (isSaved ? 1 : -1),
              },
            }
          : prevPost
      );
    }
  };

  // ------------------ Toggle Follow ------------------
  const toggleFollow = async (authorId: string) => {
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

  // ------------------ SEO variables (dynamic) ------------------
  const siteOrigin =
    (import.meta as any).env?.VITE_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://gyaanmanthan.in");

  const canonicalUrl = `${siteOrigin}/post/${id || post?._id || ""}`;

  const pageTitle = post
    ? `${post.title} — ${post.authorName || post.author?.name || "GyaanManthan"} | GyaanManthan`
    : "Post — GyaanManthan";

  const pageDescription =
    (post?.description && post.description.trim()) ||
    (post?.content ? contentToPlainText(post.content).slice(0, 180) : "Read and share gyaan, knowledge, facts and experiences on GyaanManthan.");

  const ogImage =
    (post?.images && post.images[0]) ||
    `${siteOrigin}/og-image-1200x630.png`;

  const robots =
    post?.status === "restricted" || post?.status === "blocked" || post?.status === "deleted"
      ? "noindex,nofollow"
      : "index,follow";

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            headline: post.title,
            description: pageDescription,
            image: Array.isArray(post.images) && post.images[0] ? [post.images[0]] : [ogImage],
            datePublished: post.createdAt || undefined,
            author: {
              "@type": "Person",
              name: post.authorName || post.author?.name || "Unknown",
              url: post.authorUsername ? `${siteOrigin}/user/${post.authorUsername}` : undefined
            },
            publisher: {
              "@type": "Organization",
              name: "GyaanManthan",
              logo: {
                "@type": "ImageObject",
                url: `${siteOrigin}/logo-512x512.png`
              }
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonicalUrl
            }
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${siteOrigin}/`
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Feed",
                item: `${siteOrigin}/feed`
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: canonicalUrl
              }
            ]
          }
        ]
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Post — GyaanManthan",
        url: canonicalUrl,
        description: pageDescription
      };

  if (loading) {
    return (
      <>
        <SEO
          title={pageTitle}
          description={pageDescription}
          canonical={canonicalUrl}
          robots={robots}
          openGraph={{
            title: pageTitle,
            description: pageDescription,
            url: canonicalUrl,
            type: "article",
            site_name: "GyaanManthan",
            image: ogImage,
            imageWidth: 1200,
            imageHeight: 630,
            locale: "en_IN",
          }}
          twitter={{
            card: "summary_large_image",
            title: pageTitle,
            description: pageDescription,
            image: ogImage,
            site: "@gyaanmanthan",
          }}
          jsonLd={jsonLd}
        />
        <p className="status-message">Loading post...</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title={"Post — GyaanManthan"}
          description={"Read and share gyaan, knowledge, facts and experiences on GyaanManthan."}
          canonical={canonicalUrl}
          robots={"noindex,follow"}
          openGraph={{
            title: "Post — GyaanManthan",
            description: "Read and share gyaan, knowledge, facts and experiences on GyaanManthan.",
            url: canonicalUrl,
            type: "article",
            site_name: "GyaanManthan",
            image: ogImage,
            imageWidth: 1200,
            imageHeight: 630,
            locale: "en_IN",
          }}
          twitter={{
            card: "summary_large_image",
            title: "Post — GyaanManthan",
            description: "Read and share gyaan, knowledge, facts and experiences on GyaanManthan.",
            image: ogImage,
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
        robots={robots}
        openGraph={{
          title: pageTitle,
          description: pageDescription,
          url: canonicalUrl,
          type: "article",
          site_name: "GyaanManthan",
          image: ogImage,
          imageWidth: 1200,
          imageHeight: 630,
          locale: "en_IN",
        }}
        twitter={{
          card: "summary_large_image",
          title: pageTitle,
          description: pageDescription,
          image: ogImage,
          site: "@gyaanmanthan",
        }}
        jsonLd={jsonLd}
      />

      <main className="posts-container">
        {!post ? (
          <p className="status-message">No post found</p>
        ) : (
          <article className="post-card" ref={postRef}>
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
                {/* नाम + गोल्डन टिक */}
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

                {/* username + date */}
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
                  className={`follow-btn ${followedAuthors.includes(post.authorId || "") ? "following" : ""}`}
                  onClick={() => post.authorId && toggleFollow(post.authorId)}
                >
                  {followedAuthors.includes(post.authorId || "") ? "Following" : "Follow"}
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
              {/* Comment input opens modal */}
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

              {/* Like */}
              <button
                className={`icon-btn ${post.isLikedByMe ? "active" : ""}`}
                onClick={() => toggleLike(post._id)}
                aria-label="Like"
              >
                {post.isLikedByMe ? (
                  <HeartIconSolid className="icon active-icon" />
                ) : (
                  <HeartIconOutline className="icon" />
                )}
              </button>

              {/* Save */}
              <button
                className={`icon-btn ${post.isSavedByMe ? "active" : ""}`}
                onClick={() => toggleSave(post._id)}
                aria-label="Save"
              >
                {post.isSavedByMe ? (
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

      {/* Report Modal */}
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