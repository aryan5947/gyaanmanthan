import { useEffect, useRef } from "react";

interface PostCardProps {
  post: Post;
  token: string | null;
  currentUserId?: string | null;
  likedPosts: string[];
  savedPosts: string[];
  followedAuthors: string[];
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (authorId: string) => void;
  registerView: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  token,
  currentUserId,
  likedPosts,
  savedPosts,
  followedAuthors,
  toggleLike,
  toggleSave,
  toggleFollow,
  registerView,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // 🔹 View register on viewport entry
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          registerView(post._id);
          observer.disconnect(); // ek hi baar call
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [post._id, registerView]);

  return (
    <div ref={ref} className="post-card">
      {/* Row 1: Author + Follow */}
      <div className="author-row">
        <div className="author-left">
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
            {followedAuthors.includes(post.authorId || "")
              ? "Following"
              : "Follow"}
          </button>
        )}
      </div>

      {/* Row 2: Username + Date */}
      <div className="tweet-username">
        @{post.authorUsername || post.author?.username || "unknown"}
        {post.createdAt && (
          <span className="tweet-date">
            • {new Date(post.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Post Content */}
      <h3>{post.title}</h3>
      <p>{post.description}</p>

      {/* Actions Row */}
      <div className="actions-row">
        {/* Like */}
        <button
          className={`like-btn ${
            likedPosts.includes(post._id) ? "liked" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(post._id);
          }}
        >
          ❤️ {post.stats?.likes ?? 0}
        </button>

        {/* Save */}
        <button
          className={`save-btn ${
            savedPosts.includes(post._id) ? "saved" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(post._id);
          }}
        >
          💾 {savedPosts.includes(post._id) ? "Saved" : "Save"}
        </button>

        {/* Views */}
        <span className="views-count">👁 {post.stats?.views ?? 0}</span>
      </div>
    </div>
  );
};

export default PostCard;
