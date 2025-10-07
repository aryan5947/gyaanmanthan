import { useEffect, useState, useCallback } from "react";

interface UserSummary {
  me: any;
  followers: Array<{ follower: string; createdAt: string }>;
  following: Array<{ following: string; createdAt: string }>;
  likes: {
    posts: Array<{ postId: string; createdAt: string }>;
    postMeta: Array<{ postMetaId: string; createdAt: string }>;
  };
  saves: {
    posts: Array<{ postId: string; createdAt: string }>;
    postMeta: Array<{ postMetaId: string; createdAt: string }>;
  };
  mentions: Array<{
    _id: string;
    mentionedBy: { username: string; avatarUrl?: string };
    context?: "post" | "comment" | "postMeta";
    createdAt: string;
  }>;
}

export function useUserSummary(token: string) {
  const [data, setData] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, loading, error, refresh: fetchSummary };
}
