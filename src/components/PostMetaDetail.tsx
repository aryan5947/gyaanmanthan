import React, { useEffect, useState, useRef } from "react";
import SEO from "../components/SEO";
import { useParams } from "react-router-dom";
import CommentsModal from "../components/postMetacomments";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import ShareModal from "../components/ShareModal";
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

interface Author {
  _id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  isGoldenVerified?: boolean;
}
interface FileItem {
  url: string;
  type: string;
  name?: string;
  size?: number;
}
interface Post {
  _id: string;
  title?: string;
  description?: string;
  content: any;
  author?: Author;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  isGoldenVerified?: boolean;
  files?: FileItem[];
  tags?: string[];
  createdAt?: string;
  status?: string;
  restrictionReason?: string;
  stats: {
    views: number;
    likes: number;
    saves: number;
    comments: number;
    shares: number;
    reports: number;
  };
}

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
      <div className="report-modal__content" onClick={e => e.stopPropagation()}>
        <button className="report-modal__close" onClick={onClose}>✖</button>
        <h3 className="report-modal__title">Report Post</h3>
        <div className="report-modal__reasons">
          {reasons.map((r) => (
            <label key={r} className="report-modal__reason">
              <input
                type="radio"
                name="reportReason"
                value={r}
                checked={selectedReason === r}
                onChange={e => setSelectedReason(e.target.value)}
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
          onChange={e => setExtraDetails(e.target.value)}
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

// ---------- Files Preview ----------
const PostFilesPreview: React.FC<{ files: FileItem[] }> = ({ files }) => {
  const images = files.filter(f => f.type.startsWith("image"));
  const videos = files.filter(f => f.type.startsWith("video"));
  const others = files.filter(f => !f.type.startsWith("image") && !f.type.startsWith("video"));

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
          onClick={() => { setIndex(0); setOpen(true); }}
        />
      )}
      {images.length > 1 && (
        <div className="image-preview-grid">
          {images.slice(0, 4).map((img, i) => (
            <div
              key={img.url || i}
              className="image-preview-item"
              onClick={() => { setIndex(i); setOpen(true); }}
            >
              <img src={img.url} alt={img.name || `image-${i+1}`} />
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
            <video key={vid.url || i} src={vid.url} controls className="file-preview-video" />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="other-files">
          {others.map((file, i) =>
            file.type === "pdf" ? (
              <a
                key={file.url || i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-preview-link"
              >
                📄 {file.name || "View PDF"}
              </a>
            ) : (
              <a key={file.url || i} href={file.url} download className="file-preview-link">
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
          slides={images.map(img => ({ src: img.url, title: img.name || "image" }))}
          plugins={[Thumbnails]}
        />
      )}
    </>
  );
};

// ---------- Helpers for SEO description ----------
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

// ---------- Detail Page ----------
export default function PostMetaDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  // ---------- View Logic ----------
  const viewed = useRef(false);

  // Fetch single post
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/post-meta/${id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.status === 403) {
          const data = await res.json();
          setError(data.error || "This content is not available due to policy restrictions.");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch PostMeta");
        const data = await res.json();
        setPost({
          ...data,
          stats: {
            views: data.stats?.views ?? 0,
            likes: data.stats?.likes ?? 0,
            saves: data.stats?.saves ?? 0,
            comments: data.stats?.comments ?? 0,
            shares: data.stats?.shares ?? 0,
            reports: data.stats?.reports ?? 0,
          },
        });
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  // Fetch user interactions
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.likes?.postMeta)) {
          const likedIds = data.likes.postMeta.map((l: any) => l.postMetaId.toString());
          setLikedPosts(likedIds);
          localStorage.setItem("likedPosts", JSON.stringify(likedIds));
        }
        if (Array.isArray(data.saves?.postMeta)) {
          const savedIds = data.saves.postMeta.map((s: any) => s.postMetaId.toString());
          setSavedPosts(savedIds);
          localStorage.setItem("savedPosts", JSON.stringify(savedIds));
        }
        if (Array.isArray(data.following)) {
          const followingIds = data.following.map((f: any) => f.following.toString());
          setFollowedAuthors(followingIds);
          localStorage.setItem("followedAuthors", JSON.stringify(followingIds));
        }
      } catch (err) {
        console.error("Error fetching user interactions", err);
      }
    })();
  }, [token]);

  // ---------- Register View ----------
  useEffect(() => {
    if (!post?._id || viewed.current) return;
    viewed.current = true;
    setPost(prev =>
      prev
        ? {
            ...prev,
            stats: {
              ...prev.stats,
              views: (prev.stats?.views ?? 0) + 1,
              likes: prev.stats?.likes ?? 0,
              saves: prev.stats?.saves ?? 0,
              comments: prev.stats?.comments ?? 0,
              shares: prev.stats?.shares ?? 0,
              reports: prev.stats?.reports ?? 0,
            },
          }
        : prev
    );

    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/post-meta/${post._id}/view`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ postId: post._id }),
          }
        );
        if (!res.ok) {
          setPost(prev =>
            prev
              ? {
                  ...prev,
                  stats: {
                    ...prev.stats,
                    views: Math.max((prev.stats?.views ?? 1) - 1, 0),
                    likes: prev.stats?.likes ?? 0,
                    saves: prev.stats?.saves ?? 0,
                    comments: prev.stats?.comments ?? 0,
                    shares: prev.stats?.shares ?? 0,
                    reports: prev.stats?.reports ?? 0,
                  },
                }
              : prev
          );
          viewed.current = false;
        }
      } catch {
        setPost(prev =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  views: Math.max((prev.stats?.views ?? 1) - 1, 0),
                  likes: prev.stats?.likes ?? 0,
                  saves: prev.stats?.saves ?? 0,
                  comments: prev.stats?.comments ?? 0,
                  shares: prev.stats?.shares ?? 0,
                  reports: prev.stats?.reports ?? 0,
                },
              }
            : prev
        );
        viewed.current = false;
      }
    })();
  }, [post?._id, token]);

  // ---------- Like logic ----------
  const toggleLike = async () => {
    if (!token || !post) return alert("Please login to like posts.");
    const isLiked = likedPosts.includes(post._id);
    const prev = [...likedPosts];
    const updated = isLiked ? likedPosts.filter(id => id !== post._id) : [...likedPosts, post._id];
    setLikedPosts(updated);
    localStorage.setItem("likedPosts", JSON.stringify(updated));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/post-meta/${post._id}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        ...(isLiked ? {} : { body: JSON.stringify({ postId: post._id }) }),
      });
      if (!res.ok) {
        setLikedPosts(prev);
        localStorage.setItem("likedPosts", JSON.stringify(prev));
      }
    } catch {
      setLikedPosts(prev);
      localStorage.setItem("likedPosts", JSON.stringify(prev));
    }
  };

  // ---------- Save logic ----------
  const toggleSave = async () => {
    if (!token || !post) return alert("Please login to save posts.");
    const isSaved = savedPosts.includes(post._id);
    const prev = [...savedPosts];
    const updated = isSaved ? savedPosts.filter(id => id !== post._id) : [...savedPosts, post._id];
    setSavedPosts(updated);
    localStorage.setItem("savedPosts", JSON.stringify(updated));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/post-meta/${post._id}/save`, {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        ...(isSaved ? {} : { body: JSON.stringify({ postId: post._id }) }),
      });
      if (!res.ok) {
        setSavedPosts(prev);
        localStorage.setItem("savedPosts", JSON.stringify(prev));
      }
    } catch {
      setSavedPosts(prev);
      localStorage.setItem("savedPosts", JSON.stringify(prev));
    }
  };

  // ---------- Follow logic ----------
  const toggleFollow = async () => {
    if (!token || !post?.authorId) return;
    const isFollowing = followedAuthors.includes(post.authorId);
    const endpoint = isFollowing ? "unfollow" : "follow";
    const bodyKey = isFollowing ? "userIdToUnfollow" : "userIdToFollow";

    const prev = [...followedAuthors];
    const updated = isFollowing
      ? followedAuthors.filter(id => id !== post.authorId)
      : [...followedAuthors, post.authorId];
    setFollowedAuthors(updated);
    localStorage.setItem("followedAuthors", JSON.stringify(updated));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [bodyKey]: post.authorId }),
      });
      if (!res.ok) {
        setFollowedAuthors(prev);
        localStorage.setItem("followedAuthors", JSON.stringify(prev));
      }
    } catch {
      setFollowedAuthors(prev);
      localStorage.setItem("followedAuthors", JSON.stringify(prev));
    }
  };

  // ---------- Share logic ----------
  const sharePost = async () => {
    if (!post) return;
    const url = `${window.location.origin}/post-meta/${post._id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title || "Check out this post", url });
      } catch {
        // user cancelled or share failed silently
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
      } catch {
        alert("Could not copy link. Please copy manually: " + url);
      }
    }
  };

  // ---------- SEO variables ----------
  const siteOrigin =
    (import.meta as any).env?.VITE_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://gyaanmanthan.in");

  const canonicalUrl = `${siteOrigin}/post-meta/${id || post?._id || ""}`;

  const pageTitle = post
    ? `${post.title || "Post"} — ${post.authorName || post.author?.name || "GyaanManthan"} | GyaanManthan`
    : "Post — GyaanManthan";

  const pageDescription =
    (post?.description && post.description.trim()) ||
    (post?.content ? contentToPlainText(post.content).slice(0, 180) : "Explore and share gyaan on GyaanManthan.");

  const ogImage =
    (post?.files || []).find((f) => f.type?.startsWith("image"))?.url ||
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
            headline: post.title || "Post",
            description: pageDescription,
            image: [ogImage],
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
              { "@type": "ListItem", position: 1, name: "Home", item: `${siteOrigin}/` },
              { "@type": "ListItem", position: 2, name: "Feed", item: `${siteOrigin}/feed` },
              { "@type": "ListItem", position: 3, name: post.title || "Post", item: canonicalUrl }
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

  if (loading) return (
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
      <p>Loading...</p>
    </>
  );

  if (error?.includes("policy restrictions")) {
    return (
      <>
        <SEO
          title={pageTitle}
          description={pageDescription}
          canonical={canonicalUrl}
          robots="noindex,nofollow"
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
        <div className="restricted-message">
          <h2>🔒 Content Restricted</h2>
          <p>{error}</p>
        </div>
      </>
    );
  }
  if (error) return (
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
      <p>{error}</p>
    </>
  );
  if (!post) return (
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
      <p>Not found</p>
    </>
  );

  return (
    <div className="feed-page-wrapper">
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

      <div className="feed-scroll-area">
        <div className="feed-card-list">
          <article className="tweet-card detail-page" key={post._id}>
            <div className="tweet-header">
              {(post.authorAvatar || post.author?.avatarUrl) && (
                <img
                  src={post.authorAvatar || post.author?.avatarUrl}
                  alt={post.authorName || post.author?.name || "Unknown"}
                  className="author-dp"
                />
              )}
              <div className="author-row">
                <div className="author-info">
                  <div className="author-top">
                    <span className="tweet-author">{post.authorName || post.author?.name || "Unknown"}</span>
                    {(post.isGoldenVerified || post.author?.isGoldenVerified) && (
                      <img src="/golden-tick.png" alt="Golden Verified" className="golden-tick-icon" title="Golden Verified" />
                    )}
                  </div>
                  <div className="author-subline">
                    <span className="author-username">
                      @{post.authorUsername || post.author?.username || "unknown"}
                    </span>
                    <span className="post-date">
                      {post.createdAt ? ` • ${new Date(post.createdAt).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                </div>
                {post.authorId !== currentUserId && post.authorId && (
                  <button className={`follow-btn ${followedAuthors.includes(post.authorId) ? "following" : ""}`} onClick={toggleFollow}>
                    {followedAuthors.includes(post.authorId) ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {post.title && <h1 className="tweet-title">{post.title}</h1>}
            {post.description && <p className="tweet-excerpt">{post.description}</p>}

            {/* Files Preview */}
            {post.files?.length ? (
              <div className="tweet-files">
                <PostFilesPreview files={post.files} />
              </div>
            ) : null}

            {/* Actions */}
            <div className="tweet-actions">
              <button className={`icon-btn like-btn ${likedPosts.includes(post._id) ? "active" : ""}`} onClick={toggleLike} aria-label="Like">
                {likedPosts.includes(post._id) ? <HeartIconSolid className="icon active-icon" /> : <HeartIconOutline className="icon" />}
                <span className="count">{post.stats?.likes ?? 0}</span>
              </button>
              <button className={`icon-btn save-btn ${savedPosts.includes(post._id) ? "active" : ""}`} onClick={toggleSave} aria-label="Save">
                {savedPosts.includes(post._id) ? <BookmarkIconSolid className="icon active-icon" /> : <BookmarkIconOutline className="icon" />}
              </button>
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
              <button className="icon-btn" onClick={() => setIsCommentsOpen(true)} aria-label="Comment">
                <ChatBubbleOvalLeftIcon className="icon" />
              </button>
              <button className="icon-btn" disabled>
                <ChartBarIcon className="icon" />
                <span>{post.stats?.views ?? 0}</span>
              </button>
              <button className="icon-btn" onClick={() => setIsReportOpen(true)} aria-label="Report">
                <FlagIcon className="icon" />
              </button>
            </div>

            {/* Tags */}
            {(post.tags ?? []).length > 0 && (
              <div className="tags">
                {(post.tags ?? []).map((tag, idx) => (
                  <span key={idx} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>

      {/* Comments Modal */}
      {isCommentsOpen && post.authorId && (
        <CommentsModal
          postMetaId={post._id}
          postMetaAuthorId={post.authorId}
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

      {/* Report Modal */}
      {isReportOpen && (
        <ReportModal postMetaId={post._id} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      )}
    </div>
  );
}