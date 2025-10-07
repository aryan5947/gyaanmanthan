import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Avatar from '../components/Avatar';
import styles from './Profile.module.css';

export default function Profile(): React.JSX.Element | null {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [postSubTab, setPostSubTab] = useState<'posts' | 'postMetas'>('posts');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (!id) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.user || res.data;
        const fetchedUser = {
  ...data,
  posts: data.posts || [],
  postMetas: data.postMetas || [],
  followersList: data.followersList || [],
  followingList: data.followingList || [],
  stats: {
    posts: ((data.posts?.length || 0) + (data.postMetas?.length || 0)),
    followers: data.stats?.followers || 0,
    following: data.stats?.following || 0,
  },
};
        setUser(fetchedUser);
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, id]);

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (!user) return null;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.scrollArea}>
        <div className={styles.bannerWrapper}>
          <img
            src={user.bannerUrl || '/banner-placeholder.png'}
            alt="Profile banner"
            className={styles.bannerImage}
          />
        </div>

        <div className={styles.userInfoCard}>
          <div className={styles.avatarWrapper}>
            <Avatar src={user.avatarUrl} size={140} />
          </div>
          <h2 className={styles.userName}>
            {user.name}
            {user.isVerified && (
              <span
                title="Verified"
                style={{
                  color: '#FFD700',
                  marginLeft: '6px',
                  fontSize: '1.2rem',
                }}
              >
                ✔
              </span>
            )}
          </h2>
          <p className={styles.userUsername}>@{user.username}</p>
          {user.bio && <p className={styles.userBio}>{user.bio}</p>}
        </div>

        <div className={styles.profileGrid}>
          <div className={styles.profileLeft}>
            {user.website && (
              <p>
                <strong>Website:</strong>{' '}
                <a href={user.website} target="_blank" rel="noreferrer">
                  {user.website}
                </a>
              </p>
            )}
            {user.location && (
              <p>
                <strong>Location:</strong> {user.location}
              </p>
            )}

            <div className={styles.profileStats}>
  <span
    className={styles.profileStatItem}
    onClick={() => setActiveTab('posts')}
  >
    📄 {user.stats.posts} Posts
  </span>
  <span
    className={styles.profileStatItem}
    onClick={() => setActiveTab('followers')}
  >
    👥 {user.stats.followers} Followers
  </span>
  <span
    className={styles.profileStatItem}
    onClick={() => setActiveTab('following')}
  >
    ➡️ {user.stats.following} Following
  </span>
</div>

<div className={styles.profileTabs}>
  {['posts', 'followers', 'following'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab as any)}
      className={`${styles.profileTabBtn} ${
        activeTab === tab ? styles.profileActiveTab : ''
      }`}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  ))}
</div>
            {/* Sub-tab only for Posts */}
            {activeTab === 'posts' && (
              <div className={styles.subTabRow}>
                <button
                  className={`${styles.subTabBtn} ${
                    postSubTab === 'posts' ? styles.activeSubTab : ''
                  }`}
                  onClick={() => setPostSubTab('posts')}
                >
                  Posts
                </button>
                <button
                  className={`${styles.subTabBtn} ${
                    postSubTab === 'postMetas' ? styles.activeSubTab : ''
                  }`}
                  onClick={() => setPostSubTab('postMetas')}
                >
                  PostMetas
                </button>
              </div>
            )}
          </div>

          <div className={styles.profileRight}>
            {activeTab === 'posts' &&
              renderPosts(
                postSubTab === 'posts' ? user.posts : user.postMetas,
                navigate
              )}
            {activeTab === 'followers' &&
              renderList(user.followersList || [], 'followers', navigate)}
            {activeTab === 'following' &&
              renderList(user.followingList || [], 'following', navigate)}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- Helper Functions --------------------

function renderPosts(posts: any[] = [], navigate: ReturnType<typeof useNavigate>) {
  return posts.length ? (
    <div className={styles.postGrid}>
      {posts.map((p, i) => (
        <div
          key={p._id || i}
          className={styles.postCard}
          onClick={() => {
            if (p.type === 'postMeta') {
              navigate(`/post-meta/${p.slug || p._id}`);
            } else if (p.type === 'post') {
              navigate(`/post/${p.slug || p._id}`);
            }
          }}
        >
          <h3 className={styles.postTitle}>{p.title || p.name || 'Untitled'}</h3>
          {p.excerpt && <p className={styles.postExcerpt}>{p.excerpt}</p>}
          <span className={styles.postMeta}>
            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className="no-posts">No posts yet.</p>
  );
}

function renderList(
  list: any[],
  type: string,
  navigate: ReturnType<typeof useNavigate>
) {
  return list.length ? (
    <ul className={styles.listContainer}>
      {list.map((item, i) => (
        <li
          key={i}
          className={styles.listItem}
          onClick={() => {
            if (item._id) navigate(`/user/${item._id}`);
          }}
        >
          <div className={styles.listAvatar}>
            {item.avatarUrl && <img src={item.avatarUrl} alt={item.name} />}
          </div>
          <div className={styles.listInfo}>
            <strong>{item.name || `${type} ${i + 1}`}</strong>
            {item.username && <span>@{item.username}</span>}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p>No {type} yet.</p>
  );
}
