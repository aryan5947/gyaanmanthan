// src/hooks/useUser.ts
import { useEffect, useState } from "react";

export interface User {   // 👈 export कर दिया
  username: string;
  name: string;
  avatarUrl: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const u = data.user || data;
        setUser({
          username: u.username ?? "",
          name: u.name ?? "",
          avatarUrl: u.avatarUrl ?? "",
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
