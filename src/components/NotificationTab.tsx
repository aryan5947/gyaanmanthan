import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationTab.css";

interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  relatedPostMeta?: string;
}

const NotificationTab: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllNotifications = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Parallel fetch for all three sources
        const [notifRes, postReportRes, postMetaReportRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/postreports/my`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/postmetareports/my`, { headers }),
        ]);

        const [notifData, postReportData, postMetaReportData] = await Promise.all([
          notifRes.json(),
          postReportRes.json(),
          postMetaReportRes.json(),
        ]);

        // Normalize each source to Notification[] shape
        const notifList: Notification[] = (notifData.notifications || []).map((n: any) => ({
          _id: n._id,
          type: n.type,
          message: n.message,
          createdAt: n.createdAt,
          isRead: n.isRead,
          relatedPostMeta: n.relatedPostMeta,
        }));

        const postReports: Notification[] = (postReportData.reports || []).map((r: any) => ({
          _id: r._id,
          type: "report",
          message: `Post reported: ${r.reason}`,
          createdAt: r.createdAt,
          isRead: false,
          relatedPostMeta: r.postId,
        }));

        const postMetaReports: Notification[] = (postMetaReportData.reports || []).map((r: any) => ({
          _id: r._id,
          type: "report",
          message: `PostMeta reported: ${r.reason}`,
          createdAt: r.createdAt,
          isRead: false,
          relatedPostMeta: r.postMetaId,
        }));

        // Merge and sort by createdAt desc
        const merged = [...notifList, ...postReports, ...postMetaReports].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setNotifications(merged);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // ✅ Accept mention
  const acceptMention = async (id: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/mentions/${id}/accept`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === id ? { ...n, isRead: true, type: "mention-accepted" } : n
          )
        );
      }
    } catch (err) {
      console.error("Failed to accept mention:", err);
    }
  };

  // ✅ Reject mention
  const rejectMention = async (id: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/mentions/${id}/reject`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === id ? { ...n, isRead: true, type: "mention-rejected" } : n
          )
        );
      }
    } catch (err) {
      console.error("Failed to reject mention:", err);
    }
  };

  const viewPost = (postMetaId?: string) => {
    if (!postMetaId) {
      alert("Post reference not found.");
      return;
    }
    navigate(`/post-meta/${postMetaId}`);
  };

  if (loading) return <p>Loading notifications...</p>;
  if (!notifications.length) return <p>No notifications yet.</p>;

  return (
    <div className="notification-tab">
      <h3 className="notification-tab__header">
        Your Notifications
        <button
          className="notification-tab__mark-all-btn"
          onClick={markAllAsRead}
        >
          Mark all as read
        </button>
      </h3>

      <ul className="notification-tab__list">
        {notifications.map((n) => (
          <li
            key={n._id}
            className={`notification-tab__item ${n.isRead ? "read" : "unread"}`}
          >
            <div className="notification-tab__type">
              <strong>
                {getIcon(n.type)} {n.type.toUpperCase()}
              </strong>
              {!n.isRead && <span className="notification-tab__badge" />}
            </div>

            <p className="notification-tab__message">{n.message}</p>
            <small className="notification-tab__timestamp">
              {new Date(n.createdAt).toLocaleString()}
            </small>

            <div className="notification-tab__actions">
              {!n.isRead && (
                <button
                  className="notification-tab__mark-btn"
                  onClick={() => markAsRead(n._id)}
                >
                  Mark as read
                </button>
              )}

              {n.type === "report" && (
                <button
                  className="notification-tab__view-btn"
                  onClick={() => viewPost(n.relatedPostMeta)}
                >
                  View Post
                </button>
              )}

              {/* ✅ Mention actions */}
              {n.type === "mention" && (
                <>
                  <button
                    className="notification-tab__accept-btn"
                    onClick={() => acceptMention(n._id)}
                  >
                    Accept
                  </button>
                  <button
                    className="notification-tab__reject-btn"
                    onClick={() => rejectMention(n._id)}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

function getIcon(type: string) {
  switch (type) {
    case "like":
      return "❤️";
    case "save":
      return "📌";
    case "report":
      return "🚨";
    case "resolve":
      return "✅";
    case "mention":
      return "👤";
    case "mention-accepted":
      return "✅";
    case "mention-rejected":
      return "❌";
    default:
      return "🔔";
  }
}

export default NotificationTab;
