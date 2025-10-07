import React, { useState, useEffect, useRef } from "react";
import "./CommentsModal.css";

interface Reply {
  _id?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

interface Comment {
  _id: string;
  postId: string;   // ✅ updated
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  replies: Reply[];
}

interface CommentsModalProps {
  postId: string;   // ✅ updated
  postAuthorId: string; // ✅ Add this line
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL + "/api";

// Only sort comments by createdAt when a new comment is added/deleted
function sortCommentsByCreatedAt(comments: Comment[]): Comment[] {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  postId,
  postAuthorId,
  isOpen,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    if (isOpen) fetchComments();
  }, [isOpen]);

  useEffect(() => {
    if ((editingCommentId || editingReplyId) && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCommentId, editingReplyId]);

  async function fetchComments() {
    try {
      const res = await fetch(`${API_BASE}/comments/${postId}`);
      const data = await res.json();
      if (res.ok) {
        const safeData = data.map((c: Comment) => ({
          ...c,
          likedBy: Array.isArray(c.likedBy) ? c.likedBy.map(String) : [],
          replies:
            c.replies?.map((r: Reply) => ({
              ...r,
              likedBy: Array.isArray(r.likedBy) ? r.likedBy.map(String) : [],
            })) || [],
        }));
        setComments(sortCommentsByCreatedAt(safeData));
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Error fetching comments", err);
    }
  }

  async function handleAddComment() {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/comments/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
       body: JSON.stringify({
           text: newComment.trim(),
           postAuthorId, // ✅ Include this in request body
         }),
      });
      const comment = await res.json();
      if (res.ok && comment._id && comment.text && comment.authorId) {
        setComments((prev) =>
          sortCommentsByCreatedAt([
            ...prev,
            { ...comment, replies: [], likedBy: [], likes: 0 },
          ])
        );
        setNewComment("");
      } else {
        fetchComments();
      }
    } catch (err) {
      console.error("Error adding comment", err);
    }
  }

  async function handleAddReply(commentId: string) {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!replyText[commentId]?.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE}/comments/${commentId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: replyText[commentId].trim() }),
        }
      );
      const updatedComment = await res.json();
      if (
        res.ok &&
        updatedComment &&
        updatedComment._id === commentId &&
        Array.isArray(updatedComment.replies)
      ) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  replies: updatedComment.replies.map((r: Reply) => ({
                    ...r,
                    likedBy: Array.isArray(r.likedBy)
                      ? r.likedBy.map(String)
                      : [],
                  })),
                }
              : c
          )
        );
        setReplyText((prev) => ({ ...prev, [commentId]: "" }));
      } else {
        fetchComments();
      }
    } catch (err) {
      console.error("Error adding reply", err);
    }
  }

  async function handleToggleLike(commentId: string) {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/comments/${commentId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updated = await res.json();
      if (res.ok && updated.likes !== undefined && updated.likedBy) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  likes: updated.likes,
                  likedBy: updated.likedBy.map(String),
                }
              : c
          )
        );
      } else {
        fetchComments();
      }
    } catch (err) {
      console.error("Error toggling like", err);
      fetchComments();
    }
  }

  async function handleToggleReplyLike(commentId: string, replyId: string) {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/comments/${commentId}/reply/${replyId}/like`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updated = await res.json();
      if (res.ok && updated.likes !== undefined && updated.likedBy) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  replies: c.replies.map((r) =>
                    r._id === replyId
                      ? {
                          ...r,
                          likes: updated.likes,
                          likedBy: updated.likedBy.map(String),
                        }
                      : r
                  ),
                }
              : c
          )
        );
      } else {
        fetchComments();
      }
    } catch (err) {
      console.error("Error toggling reply like", err);
      fetchComments();
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments((prev) =>
          sortCommentsByCreatedAt(prev.filter((c) => c._id !== commentId))
        );
      }
    } catch (err) {
      console.error("Error deleting comment", err);
    }
  }

  async function handleDeleteReply(commentId: string, replyId: string) {
    if (!window.confirm("Delete this reply?")) return;
    try {
      const res = await fetch(
        `${API_BASE}/comments/${commentId}/reply/${replyId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, replies: c.replies.filter((r) => r._id !== replyId) }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Error deleting reply", err);
    }
  }

  async function handleEditSave(commentId: string) {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: editText.trim() }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, text: editText } : c))
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (err) {
      console.error("Error editing comment", err);
    }
  }

  async function handleEditReplySave(commentId: string, replyId: string) {
    if (!editText.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE}/comments/${commentId}/reply/${replyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: editText.trim() }),
        }
      );
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  replies: c.replies.map((r) =>
                    r._id === replyId ? { ...r, text: editText } : r
                  ),
                }
              : c
          )
        );
        setEditingReplyId(null);
        setEditText("");
      }
    } catch (err) {
      console.error("Error editing reply", err);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddComment();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="comments-modal-backdrop" onClick={onClose}>
      <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comments-header">
          <h3>💬 Comments</h3>
          <button className="close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map((c) => {
              const hasLiked = c.likedBy.includes(currentUserId || "");
              return (
                <div key={c._id} className="comment-item">
                  <div className="comment-meta">
                    {c.authorAvatar && (
                      <img
                        src={c.authorAvatar}
                        alt={c.authorName}
                        className="comment-avatar"
                      />
                    )}
                    <div className="comment-author-info">
                      <strong>{c.authorName}</strong>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {editingCommentId === c._id ? (
                    <div className="edit-section">
                      <input
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <button onClick={() => handleEditSave(c._id)}>Save</button>
                      <button onClick={() => setEditingCommentId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p>{c.text}</p>
                  )}

                  <div className="comment-actions">
                    <button
                      className="like-btn"
                      onClick={() => handleToggleLike(c._id)}
                    >
                      {hasLiked ? "👎 Unlike" : "👍 Like"} {c.likes}
                    </button>
                    {c.authorId === currentUserId && (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => {
                            setEditingCommentId(c._id);
                            setEditText(c.text);
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(c._id)}
                        >
                          🗑 Delete
                        </button>
                      </>
                    )}
                  </div>

                  {/* Replies */}
                  <div className="replies">
                    {c.replies.map((r) => {
                      const replyLiked = r.likedBy.includes(
                        currentUserId || ""
                      );
                      return (
                        <div key={r._id} className="reply-item">
                          <div className="reply-meta">
                            {r.authorAvatar && (
                              <img
                                src={r.authorAvatar}
                                alt={r.authorName}
                                className="reply-avatar"
                              />
                            )}
                            <div>
                              <strong>{r.authorName}</strong>{" "}
                              <span>
                                {new Date(r.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {editingReplyId === r._id ? (
                            <div className="edit-section">
                              <input
                                ref={editInputRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                              />
                              <button
                                onClick={() =>
                                  handleEditReplySave(c._id, r._id || "")
                                }
                              >
                                Save
                              </button>
                              <button onClick={() => setEditingReplyId(null)}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p>{r.text}</p>
                          )}

                          <div className="reply-actions">
                            <button
                              className="like-btn"
                              onClick={() =>
                                handleToggleReplyLike(c._id, r._id || "")
                              }
                            >
                              {replyLiked ? "👎 Unlike" : "👍 Like"} {r.likes}
                            </button>
                            {r.authorId === currentUserId && (
                              <>
                                <button
                                  className="edit-btn"
                                  onClick={() => {
                                    setEditingReplyId(r._id || "");
                                    setEditText(r.text);
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() =>
                                    handleDeleteReply(c._id, r._id || "")
                                  }
                                >
                                  🗑 Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="reply-input">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyText[c._id] || ""}
                        onChange={(e) =>
                          setReplyText((prev) => ({
                            ...prev,
                            [c._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddReply(c._id)
                        }
                      />
                      <button onClick={() => handleAddReply(c._id)}>
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-comments">No comments yet. Be the first!</p>
          )}
        </div>

        <div className="comment-input">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={handleAddComment}>Post</button>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="login-modal-backdrop"
          onClick={() => setShowLoginModal(false)}
        >
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Login Required</h3>
            <p>You must be logged in to comment. Please login first!</p>
            <button
              className="login-btn"
              onClick={() => {
                setShowLoginModal(false);
                window.location.href = "/login";
              }}
            >
              Login Now
            </button>
            <button
              className="cancel-btn"
              onClick={() => setShowLoginModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsModal;
