import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
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

  // For SEO
  const siteOrigin =
    (import.meta as any).env?.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://gyaanmanthan.in');
  const canonicalUrl = `${siteOrigin}/user/${id || ''}`;

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
            posts: (data.posts?.length || 0) + (data.postMetas?.length || 0),
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

  // ---------- SEO computed fields ----------
  const pageTitle = user
    ? `${user.name || 'User'} (@${user.username || 'user'}) – Profile | GyaanManthan`
    : `Profile | GyaanManthan`;

  const baseDesc = user
    ? [
        `${user.name || 'User'} (@${user.username || 'user'}) on GyaanManthan.`,
        user.bio ? `Bio: ${user.bio}` : '',
        `Posts: ${user.stats?.posts ?? 0}, Followers: ${user.stats?.followers ?? 0}, Following: ${user.stats?.following ?? 0}.`,
      ]
        .filter(Boolean)
        .join(' ')
    : 'View user profile on GyaanManthan – India’s Knowledge Social Media.';

  const pageDescription = baseDesc.length > 180 ? baseDesc.slice(0, 179).trimEnd() + '…' : baseDesc;

  const ogImage =
    user?.bannerUrl ||
    user?.avatarUrl ||
    `${siteOrigin}/og-image-1200x630.png`;

  const robots = user?.status === 'blocked' || user?.status === 'deleted' ? 'noindex,nofollow' : 'index,follow';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        name: pageTitle,
        url: canonicalUrl,
        description: pageDescription,
      },
      {
        '@type': 'Person',
        name: user?.name || 'User',
        alternateName: user?.username ? `@${user.username}` : undefined,
        url: canonicalUrl,
        image: user?.avatarUrl || undefined,
        description: user?.bio || undefined,
        homeLocation: user?.location || undefined,
        sameAs: user?.website ? [user.website] : undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteOrigin}/` },
          { '@type': 'ListItem', position: 2, name: 'Profile', item: canonicalUrl },
        ],
      },
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
            type: 'profile',
            site_name: 'GyaanManthan',
            image: ogImage,
            imageWidth: 1200,
            imageHeight: 630,
            locale: 'en_IN',
          }}
          twitter={{
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDescription,
            image: ogImage,
            site: '@gyaanmanthan',
          }}
          jsonLd={jsonLd}
        />
        <div className={styles.loading}>Loading profile...</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SEO
          title="Profile | GyaanManthan"
          description="Profile not found on GyaanManthan."
          canonical={canonicalUrl}
          robots="noindex,follow"
          openGraph={{
            title: 'Profile | GyaanManthan',
            description: 'Profile not found on GyaanManthan.',
            url: canonicalUrl,
            type: 'profile',
            site_name: 'GyaanManthan',
            image: `${siteOrigin}/og-image-1200x630.png`,
            imageWidth: 1200,
            imageHeight: 630,
            locale: 'en_IN',
          }}
          twitter={{
            card: 'summary_large_image',
            title: 'Profile | GyaanManthan',
            description: 'Profile not found on GyaanManthan.',
            image: `${siteOrigin}/twitter-image-1200x600.png`,
            site: '@gyaanmanthan',
          }}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Profile | GyaanManthan',
            url: canonicalUrl,
            description: 'Profile not found on GyaanManthan.',
          }}
        />
        {null}
      </>
    );
  }

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
          type: 'profile',
          site_name: 'GyaanManthan',
          image: ogImage,
          imageWidth: 1200,
          imageHeight: 630,
          locale: 'en_IN',
        }}
        twitter={{
          card: 'summary_large_image',
          title: pageTitle,
          description: pageDescription,
          image: ogImage,
          site: '@gyaanmanthan',
        }}
        jsonLd={jsonLd}
      />

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

              {activeTab === 'followers' && (
                <UserList list={user.followersList || []} type="followers" />
              )}
              {activeTab === 'following' && (
                <UserList list={user.followingList || []} type="following" />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
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

// ---------- UserList with Follow/Unfollow ----------
function UserList({ list, type }: { list: any[]; type: string }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';
  const currentUserId = (localStorage.getItem('userId') || '').toString();
  const routeUserId = (useParams().id || '').toString();

  const [following, setFollowing] = useState<Record<string, boolean>>({});

  // Helper: normalize possible id shapes from summary
  const extractId = (x: any): string => {
    if (!x) return '';
    if (typeof x === 'string') return x;
    return (
      x.following?.toString?.() ||
      x.userId?.toString?.() ||
      x._id?.toString?.() ||
      x.id?.toString?.() ||
      ''
    );
  };

  // Seed from localStorage followedAuthors if present
  useEffect(() => {
    try {
      const seed = JSON.parse(localStorage.getItem('followedAuthors') || '[]');
      if (Array.isArray(seed) && seed.length) {
        const map: Record<string, boolean> = {};
        seed.forEach((id: any) => {
          const sid = typeof id === 'string' ? id : extractId(id);
          if (sid) map[sid] = true;
        });
        setFollowing((prev) => ({ ...map, ...prev }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load following map from summary (authoritative)
  useEffect(() => {
    let cancelled = false;
    const fetchFollowing = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn('user/summary failed with', res.status);
          return;
        }
        const data = await res.json();

        const ids: string[] = [];
        if (Array.isArray(data.following)) {
          data.following.forEach((f: any) => {
            const id = extractId(f);
            if (id) ids.push(id);
          });
        }
        if (Array.isArray(data.followingIds)) {
          data.followingIds.forEach((id: any) => {
            const sid = typeof id === 'string' ? id : extractId(id);
            if (sid) ids.push(sid);
          });
        }

        if (!cancelled) {
          const map: Record<string, boolean> = {};
          ids.forEach((sid) => (map[sid] = true));
          setFollowing((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error('Error fetching following summary:', err);
      }
    };

    fetchFollowing();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Fallback: If viewing own profile and tab is "following", mark all as followed
  useEffect(() => {
    if (routeUserId && currentUserId && routeUserId === currentUserId && type === 'following') {
      const map: Record<string, boolean> = {};
      list.forEach((item) => {
        const id = (item?._id || item?.id || '').toString();
        if (id) map[id] = true;
      });
      setFollowing((prev) => ({ ...map, ...prev }));
    }
  }, [routeUserId, currentUserId, type, list]);

  const persistLocal = (updater: (arr: string[]) => string[]) => {
    try {
      const seed = JSON.parse(localStorage.getItem('followedAuthors') || '[]');
      const arr = Array.isArray(seed) ? seed.map(String) : [];
      const next = updater(arr);
      localStorage.setItem('followedAuthors', JSON.stringify(next));
    } catch {}
  };

  const toggleFollow = async (id: string) => {
    if (!token) {
      alert('Please login first.');
      return;
    }
    if (!id) return;

    const isCurrentlyFollowing = !!following[id];
    const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
    const body = isCurrentlyFollowing ? { userIdToUnfollow: id } : { userIdToFollow: id };

    // optimistic
    setFollowing((prev) => ({ ...prev, [id]: !isCurrentlyFollowing }));
    persistLocal((arr) =>
      isCurrentlyFollowing ? arr.filter((x) => x !== id) : Array.from(new Set([...arr, id]))
    );

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // rollback
        setFollowing((prev) => ({ ...prev, [id]: isCurrentlyFollowing }));
        persistLocal((arr) =>
          isCurrentlyFollowing ? Array.from(new Set([...arr, id])) : arr.filter((x) => x !== id)
        );

        const errData = await res.json().catch(() => ({}));
        console.error('Follow/Unfollow failed:', errData);
        alert(errData.message || 'Request failed');
      }
    } catch (err) {
      // rollback
      setFollowing((prev) => ({ ...prev, [id]: isCurrentlyFollowing }));
      persistLocal((arr) =>
        isCurrentlyFollowing ? Array.from(new Set([...arr, id])) : arr.filter((x) => x !== id)
      );
      console.error('Follow/Unfollow error:', err);
      alert('Network error');
    }
  };

  if (!list.length) return <p>No {type} yet.</p>;

  return (
    <ul className={styles.listContainer}>
      {list.map((item, i) => {
        const itemId = (item?._id || item?.id || '').toString();
        const isSelf = itemId && currentUserId && itemId === currentUserId;

        return (
          <li key={itemId || i} className={styles.listItem}>
            <div
              className={styles.listAvatar}
              onClick={() => itemId && navigate(`/user/${itemId}`)}
            >
              {item.avatarUrl && <img src={item.avatarUrl} alt={item.name || 'User'} />}
            </div>
            <div className={styles.listInfo}>
              <strong>{item.name || `${type} ${i + 1}`}</strong>
              {item.username && <span>@{item.username}</span>}
            </div>

            {/* Follow / Unfollow Button (hide on self) */}
            {itemId && !isSelf && (
              <button
                className={styles.followBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(itemId);
                }}
              >
                {following[itemId] ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}