import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MediaItem, Status } from "./type";
import "./StatusFeed.css";

interface AuthUser {
  id: string;
  name: string;
  avatar: string;
  isGoldenVerified: boolean;
}

const apiBase = `${import.meta.env.VITE_API_URL}/api`;
const axiosClient = axios.create({ baseURL: apiBase });
axiosClient.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Helper to group statuses by userId
function groupStatusesByUser(statuses: Status[]) {
  const map = new Map<string, { user: Status, list: Status[] }>();
  statuses.forEach(s => {
    if (!map.has(s.userId)) {
      map.set(s.userId, { user: s, list: [s] });
    } else {
      map.get(s.userId)!.list.push(s);
    }
  });
  // Sort each user's statuses by createdAt desc (latest first)
  map.forEach(obj => obj.list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  return Array.from(map.values());
}

export default function StatusFeed({ userId: userIdProp }: { userId?: string }) {
  const [auth, setAuth] = useState<AuthUser>({ id: "", name: "", avatar: "", isGoldenVerified: false });
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const navigate = useNavigate();

  /* -------- Load Auth User -------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosClient.get("/user/me");
        if (!mounted) return;
        const u = res.data?.user || res.data;
        setAuth({
          id: u?._id || userIdProp || "",
          name: u?.name || u?.username || "User",
          avatar: u?.avatar || u?.userAvatar || "https://res.cloudinary.com/djwujtay2/image/upload/v1759847620/avatar-placeholder_nhv8eu.png",
          isGoldenVerified: !!u?.isGoldenVerified
        });
      } catch {
        try {
          const raw = localStorage.getItem("user");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!mounted) return;
            setAuth({
              id: parsed?._id || userIdProp || "",
              name: parsed?.name || parsed?.username || "User",
              avatar: parsed?.avatar || parsed?.userAvatar || "https://res.cloudinary.com/djwujtay2/image/upload/v1759847620/avatar-placeholder_nhv8eu.png",
              isGoldenVerified: !!parsed?.isGoldenVerified
            });
          } else if (userIdProp) {
            setAuth(a => ({ ...a, id: userIdProp }));
          }
        } catch {
          if (userIdProp) setAuth(a => ({ ...a, id: userIdProp }));
        }
      }
    })();
    return () => { mounted = false; };
  }, [userIdProp]);

  /* -------- Fetch Statuses -------- */
  const loadStatuses = useCallback(() => {
    setLoading(true);
    axiosClient.get("/status")
      .then(res => {
        const arr: Status[] = res.data.statuses || [];
        setStatuses(arr);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  /* -------- Helpers -------- */
  const markViewed = async (statusId: string) => {
    if (!auth.id) return;
    try {
      await axiosClient.post("/status/view", { statusId, viewerId: auth.id });
      setStatuses(prev =>
        prev.map(s =>
          s._id === statusId
            ? {
                ...s,
                viewCount: s.viewCount + (s.views?.includes(auth.id) ? 0 : 1),
                views: [...(s.views || []), auth.id]
              }
            : s
        )
      );
    } catch { /* ignore */ }
  };

  const likeStatus = async (e: React.MouseEvent, statusId: string) => {
    e.stopPropagation();
    if (!auth.id) return alert("Login required");
    try {
      await axiosClient.post("/status/like", { statusId, userId: auth.id });
      setStatuses(prev => prev.map(s => (s._id === statusId ? { ...s, likeCount: s.likeCount + 1 } : s)));
    } catch {}
  };

  const myStatus =
    statuses.filter(s => s.userId === auth.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

  // Group statuses by user (excluding self)
  const groupedUsers = groupStatusesByUser(statuses.filter(s => s.userId !== auth.id));

  const isViewed = (user: Status) => !!(user.views && auth.id && user.views.includes(auth.id));

  // On click, open viewer page for user
  const goToUserStory = (userId: string) => {
    const stories = groupedUsers.find(g => g.user.userId === userId)?.list || [];
    if (stories.length) markViewed(stories[0]._id);
    navigate(`/story/${userId}`);
  };

  // Handler for create menu navigation
  const handleCreateMenu = (type: "text" | "media") => {
    setShowCreateMenu(false);
    if (type === "text") navigate("/create-text-status");
    else navigate("/create-media-status");
  };

  return (
    <div className="status-panel">
      <div className="status-panel-header">
        <h2>Status</h2>
        <div className="status-header-actions">
          <button
            className="status-icon-btn"
            title="Add Status"
            onClick={() => {
              if (auth.id) setShowCreateMenu(true);
              else alert("Login required");
            }}
            disabled={!auth.id}
          >
            +
          </button>
        </div>
      </div>

      {/* My Status */}
      <div className="status-my-section">
        <div
          className="status-item my-status"
          onClick={() => {
            if (!auth.id) return alert("Login required");
            if (myStatus) {
              // If you have any status, show your story viewer
              navigate(`/story/${auth.id}`);
            } else {
              // If you don't have a status, show create menu
              setShowCreateMenu(true);
            }
          }}
        >
          <div className="status-avatar-wrapper my">
            <div className="status-avatar-ring my">
              <img
                src={auth.avatar || "https://res.cloudinary.com/djwujtay2/image/upload/v1759847620/avatar-placeholder_nhv8eu.png"}
                alt="me"
                className="status-avatar-img"
              />
              <span className="status-add-badge">+</span>
            </div>
          </div>
          <div className="status-item-text">
            <div className="status-item-name">My status</div>
            <div className="status-item-meta">
              {myStatus
                ? "Updated " +
                  new Date(myStatus.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Click to add status update"}
            </div>
          </div>
        </div>
      </div>

      {/* Status Create Menu */}
      {showCreateMenu && (
        <div className="status-create-menu">
          <button
            onClick={() => handleCreateMenu("text")}
            className="status-create-menu-btn"
          >
            ➤ Text Status
          </button>
          <button
            onClick={() => handleCreateMenu("media")}
            className="status-create-menu-btn"
          >
            ➤ Media Status
          </button>
          <button
            onClick={() => setShowCreateMenu(false)}
            className="status-create-menu-btn"
            style={{ color: "red" }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="status-divider-label">Recent</div>

      {loading && <div className="status-loading">Loading…</div>}
      {!loading && groupedUsers.length === 0 && <div className="status-empty-mini">No recent statuses.</div>}

      <div className="status-list">
        {groupedUsers.map(({ user, list }) => (
          <div
            key={user.userId}
            className={`status-item ${isViewed(user) ? "viewed" : "unviewed"}`}
            onClick={() => goToUserStory(user.userId)}
          >
            <div className="status-avatar-wrapper">
              <div className={`status-avatar-ring ${isViewed(user) ? "viewed" : "unviewed"}`}>
                <img
                  src={user.userAvatar || "https://res.cloudinary.com/djwujtay2/image/upload/v1759847620/avatar-placeholder_nhv8eu.png"}
                  alt={user.userName}
                  className="status-avatar-img"
                />
              </div>
            </div>
            <div className="status-item-text">
              <div className="status-item-name">
                {user.userName}
                {user.isGoldenVerified && <span className="golden-dot" title="Golden verified">★</span>}
              </div>
              <div className="status-item-meta">
                {new Date(list[0].createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
            </div>
            <button className="status-like-pill" title="Like" onClick={(e) => likeStatus(e, list[0]._id)}>❤️ {list[0].likeCount}</button>
          </div>
        ))}
      </div>
    </div>
  );
}