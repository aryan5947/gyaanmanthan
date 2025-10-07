import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import styles from "./Profile.module.css";
import {
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"
import axios from "axios";

const WhiteGearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.05A1.65 1.65 0 0 0 11 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.05a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.05A1.65 1.65 0 0 0 19.4 15z" />
  </svg>
);


export default function Profile(): React.JSX.Element | null {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "posts" | "saved" | "liked" | "followers" | "following" | "notifications"
  >("posts");
  const [subTab, setSubTab] = useState<"posts" | "postMetas">("posts");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
       const fetchedUser = data.user || data;

fetchedUser.posts = fetchedUser.posts || [];
fetchedUser.postMetas = fetchedUser.postMetas || [];
fetchedUser.savedPosts = fetchedUser.savedPosts || [];
fetchedUser.savedPostMetas = fetchedUser.savedPostMetas || [];
fetchedUser.likedPosts = fetchedUser.likedPosts || [];
fetchedUser.likedPostMetas = fetchedUser.likedPostMetas || [];
fetchedUser.followersList = fetchedUser.followersList || [];
fetchedUser.followingList = fetchedUser.followingList || [];
fetchedUser.notifications = fetchedUser.notifications || [];

// calculate totals
const totalPosts = (fetchedUser.posts.length) + (fetchedUser.postMetas.length);
const totalLikes = (fetchedUser.likedPosts.length) + (fetchedUser.likedPostMetas.length);
const totalSaves = (fetchedUser.savedPosts.length) + (fetchedUser.savedPostMetas.length);

fetchedUser.stats = {
  ...fetchedUser.stats, // preserve any existing fields
  posts: totalPosts,
  followers: fetchedUser.stats?.followers || fetchedUser.followersList.length || 0,
  following: fetchedUser.stats?.following || fetchedUser.followingList.length || 0,
  likes: totalLikes,
  saves: totalSaves,
};
        setUser(fetchedUser);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (!user) return null;
// ---------- Settings ----------
const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
};

const handleUpdate = () => navigate("/edit-profile");

const handleDelete = async () => {
  if (
    !window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    )
  ) {
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("No token found. Please log in again.");
    navigate("/login");
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      localStorage.removeItem("token");
      alert("✅ Account deleted successfully");
      navigate("/signup");
    } else {
      alert(`❌ Failed to delete account: ${data.message || res.statusText}`);
    }
  } catch (err) {
    console.error("Delete request error:", err);
    alert("❌ Server error while deleting account");
  }
};

const handleResetPassword = async () => {
  if (!user?.email) {
    alert("No email found for this account");
    return;
  }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth-mail/request-reset`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("✅ Password reset link sent to your email");
    } else {
      alert(`❌ ${data.message || "Failed to send reset link"}`);
    }
  } catch (err) {
    console.error("Reset password error:", err);
    alert("❌ Server error while sending reset link");
  }
};

  // ---------- Updated Telegram connect handler ----------

const handleConnectTelegram = async () => {
  const token = localStorage.getItem("token")?.trim();
  if (!token) {
    alert("❌ Please log in first");
    return;
  }

  try {
    console.log("🔹 Initiating Telegram connect...");

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/user/connect-telegram-test`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 sec timeout
      }
    );

    const data = response.data;
    console.log("✅ Telegram connect response:", data);

    if (data?.success && data?.authUrl) {
      // Open Telegram deep link in new tab
      window.open(data.authUrl, "_blank");
    } 
    else if (data?.message) {
      alert(`❌ ${data.message}`);
    } 
    else {
      alert("❌ Failed to initiate Telegram connect");
    }

  } catch (error: any) {
    console.error("❌ Telegram connect error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const msg =
          error.response.data?.message ||
          `Server returned ${error.response.status}`;
        alert(`❌ ${msg}`);
      } else if (error.request) {
        alert("❌ No response from server. Check your network.");
      } else {
        alert("❌ Error: " + error.message);
      }
    } else {
      alert("❌ Unexpected error: " + String(error));
    }
  }
};


  // ---------- Post View Helper ----------
  const viewPost = (postId?: string, postMetaId?: string) => {
    if (postMetaId) {
      navigate(`/post-meta/${postMetaId}`);
    } else if (postId) {
      navigate(`/post/${postId}`);
    } else {
      alert("Post reference not found.");
    }
  };

  // ---------- SubTabs Renderer ----------
  const renderSubTabs = () => (
    <div className={styles.subTabRow}>
      <button
        className={subTab === "posts" ? styles.activeSubTab : ""}
        onClick={() => setSubTab("posts")}
      >
        Posts
      </button>
      <button
        className={subTab === "postMetas" ? styles.activeSubTab : ""}
        onClick={() => setSubTab("postMetas")}
      >
        PostMetas
      </button>
    </div>
  );

  return (
    <div className={styles.profileContainer}>
      {/* ---------- Header ---------- */}
      <header className={styles.headerBar}>
        <h1 className={styles.welcomeText}>Welcome, {user.username}</h1>
        <div className={styles.settingsWrapper}>
          <button
            className={styles.settingsBtn}
            onClick={() => setShowSettings((prev) => !prev)}
          >
            <WhiteGearIcon />
          </button>
          {showSettings && (
            <div className={styles.settingsDropdown}>
              <button onClick={handleUpdate}>Update Profile</button>
              <button onClick={handleResetPassword}>Reset Password</button>
              <button onClick={handleDelete}>Delete Account</button>
              <button onClick={handleLogout}>Logout</button>
              <button onClick={handleConnectTelegram}>Connect Telegram</button>
            </div>
          )}
        </div>
      </header>

      {/* ---------- Main Content ---------- */}
      <div className={styles.scrollArea}>
        {/* Banner */}
        <div className={styles.bannerWrapper}>
          <img
            src={user.bannerUrl || "/banner-placeholder.png"}
            alt="Profile banner"
            className={styles.bannerImage}
          />
          
        </div>

        {/* User Info */}
        <div className={styles.userInfoCard}>
  <div className={styles.avatarWrapper}>
    <Avatar src={user.avatarUrl} size={140} />
  </div>

  {/* ✅ Name + Golden Tick ek row me */}
  <div className={styles.nameRow}>
    <h2 className={styles.userName}>{user.name}</h2>
    {(user.isGoldenVerified || user.author?.isGoldenVerified) && (
      <img
        src="/golden-tick.png"
        alt="Golden Verified"
        className={styles.goldenTickIcon}
        title="Golden Verified"
      />
    )}
  </div>

  {/* ✅ Username niche */}
  <p className={styles.userUsername}>@{user.username}</p>

  {/* ✅ Bio */}
  {user.bio && <p className={styles.userBio}>{user.bio}</p>}

  {/* ✅ Email */}
  <p>
    <strong>Email:</strong> {user.email}
  </p>
</div>


        {/* Profile Grid */}
        <div className={styles.profileGrid}>
          {/* Left Sidebar */}
          <div className={styles.profileLeft}>
            <div className={styles.statsRow}>
              <span
                className={styles.statChip}
                onClick={() => setActiveTab("posts")}
              >
                📄 {user.stats.posts} Posts
              </span>
              <span
                className={styles.statChip}
                onClick={() => setActiveTab("followers")}
              >
                👥 {user.stats.followers} Followers
              </span>
              <span
                className={styles.statChip}
                onClick={() => setActiveTab("following")}
              >
                ➡️ {user.stats.following} Following
              </span>
              {user.stats.likes !== undefined && (
                <span className={styles.statChip}>❤️ {user.stats.likes} Likes</span>
              )}
              {user.stats.saves !== undefined && (
                <span className={styles.statChip}>💾 {user.stats.saves} Saves</span>
              )}
            </div>

            {/* Tabs */}
            <div className={styles.tabRow}>
              <button
                className={activeTab === "posts" ? styles.activeTab : ""}
                onClick={() => setActiveTab("posts")}
              >
                Posts
              </button>
              <button
                className={activeTab === "saved" ? styles.activeTab : ""}
                onClick={() => setActiveTab("saved")}
              >
                Saved
              </button>
              <button
                className={activeTab === "liked" ? styles.activeTab : ""}
                onClick={() => setActiveTab("liked")}
              >
                Liked
              </button>
              <button
                className={activeTab === "followers" ? styles.activeTab : ""}
                onClick={() => setActiveTab("followers")}
              >
                Followers
              </button>
              <button
                className={activeTab === "following" ? styles.activeTab : ""}
                onClick={() => setActiveTab("following")}
              >
                Following
              </button>
              <button
                className={activeTab === "notifications" ? styles.activeTab : ""}
                onClick={() => setActiveTab("notifications")}
              >
                Notifications
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className={styles.profileRight}>
            {["posts", "saved", "liked"].includes(activeTab) && renderSubTabs()}

            {activeTab === "posts" &&
              (subTab === "posts" ? (
                <PostList posts={user.posts} viewPost={viewPost} />
              ) : (
                <PostList posts={user.postMetas} viewPost={viewPost} tabType="postMeta" />
              ))}

            {activeTab === "saved" &&
              (subTab === "posts" ? (
                <PostList posts={user.savedPosts} viewPost={viewPost} />
              ) : (
                <PostList posts={user.savedPostMetas} viewPost={viewPost} tabType="postMeta" />
              ))}

            {activeTab === "liked" &&
              (subTab === "posts" ? (
                <PostList posts={user.likedPosts} viewPost={viewPost} />
              ) : (
                <PostList posts={user.likedPostMetas} viewPost={viewPost} tabType="postMeta" />
              ))}

            {activeTab === "followers" && (
              <UserList list={user.followersList} type="followers" />
            )}
            {activeTab === "following" && (
              <UserList list={user.followingList} type="following" />
            )}
            {activeTab === "notifications" && (
              <NotificationList notifications={user.notifications} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- PostList with Edit & Delete ----------
function PostList({
  posts,
  viewPost,
  tabType,
}: {
  posts: any[];
  viewPost: (postId?: string, postMetaId?: string) => void;
  tabType?: "postMeta" | "post";
}) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId"); // 👈 current user id

 if (!posts.length) return <p className={styles.noPosts}>No posts yet.</p>;


  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const url =
        tabType === "postMeta"
          ? `${import.meta.env.VITE_API_URL}/api/post-meta/${id}`
          : `${import.meta.env.VITE_API_URL}/api/post/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("✅ Deleted successfully");
        window.location.reload();
      } else {
        alert("❌ Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting item");
    }
  };

  const handleEdit = (id: string) => {
    if (tabType === "postMeta") {
      alert("Editing PostMeta is not supported");
    } else {
      navigate(`/edit-post/${id}`);
    }
  };

  return (
    <div className={styles.postGrid}>
      {posts.map((p, i) => {
        const oid =
          p.postMetaId ||
          p._id?.$oid ||
          p._id ||
          p.id ||
          (typeof p.postMeta === "object"
            ? p.postMeta?._id?.$oid || p.postMeta?._id
            : p.postMeta);

        const isOwner = p.authorId === currentUserId; // 👈 check ownership

        return (
          <div
            key={oid || i}
            className={styles.postCard}
            onClick={() => {
              if (!oid) {
                console.warn("No valid ID found for clicked item:", p);
                return;
              }
              if (tabType === "postMeta") {
                viewPost(undefined, oid);
              } else {
                viewPost(p.slug || oid);
              }
            }}
          >
            <h3 className={styles.postTitle}>{p.title || p.name || "Untitled"}</h3>
            {p.excerpt && <p className={styles.postExcerpt}>{p.excerpt}</p>}
            <span className={styles.postMeta}>
              {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
            </span>

            {/* Edit & Delete Buttons only if owner */}
            {isOwner && (
              <div className={styles.postActions}>
                {tabType !== "postMeta" && (
                 <button
                  className={styles.editBtn}
  onClick={(e) => {
    e.stopPropagation();
    handleEdit(oid);
  }}
>
  <PencilSquareIcon className="h-5 w-5 inline-block mr-1" />
  Edit
</button>
                )}
                <button
  className={styles.deleteBtn}
  onClick={(e) => {
    e.stopPropagation();
    handleDelete(oid);
  }}
>
  <TrashIcon className="h-5 w-5 inline-block mr-1" />
  Delete
</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ---------- UserList ----------
function UserList({ list, type }: { list: any[]; type: string }) {
  const navigate = useNavigate();
  if (!list.length) return <p>No {type} yet.</p>;

  return (
    <ul className={styles.listContainer}>
      {list.map((item, i) => (
        <li
          key={i}
          className={styles.listItem}
          onClick={() => {
            if (item._id) {
              navigate(`/user/${item._id}`);
            }
          }}
        >
          <div className={styles.listAvatar}>
            {item.avatarUrl && <img src={item.avatarUrl} alt={item.name || "User"} />}
          </div>
          <div className={styles.listInfo}>
            <strong>{item.name || `${type} ${i + 1}`}</strong>
            {item.username && <span>@{item.username}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------- NotificationList ----------
function NotificationList({ notifications }: { notifications: any[] }) {
  const navigate = useNavigate();

  const viewPost = (postId?: string, postMetaId?: string) => {
    if (postMetaId) {
      navigate(`/post-meta/${postMetaId}`);
    } else if (postId) {
      navigate(`/post/${postId}`);
    } else {
      alert("Post reference not found.");
    }
  };

  if (!notifications.length) return <p>No notifications yet.</p>;

  return (
    <ul className={styles.notificationsList}>
      {notifications.map((note, i) => {
        const postId =
          note.postId ||
          note.relatedPost ||
          (note.type === "post" ? note._id : undefined);

        const postMetaId =
          note.postMetaId ||
          note.relatedPostMeta ||
          note.postMetaID ||
          (note.type === "postMeta" ? note._id : undefined);

        return (
          <li key={i} className={styles.notificationItem}>
            <span>{note.message || "Notification"}</span>
            {note.createdAt && (
              <small>{new Date(note.createdAt).toLocaleString()}</small>
            )}

            {(postId || postMetaId) && (
              <button
                className={styles.viewBtn}
                onClick={() => viewPost(postId, postMetaId)}
              >
                View Post
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
