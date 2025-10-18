import axios from "axios";

const apiBase = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type MentionUser = {
  _id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  followersCount?: number;
};

export async function searchUsers(q: string): Promise<MentionUser[]> {
  if (!q.trim()) return [];
  const res = await axios.get(`${apiBase}/search`, {
    params: { q },
    headers: { ...authHeaders() },
  });
  const data = res.data || {};
  return (data.usersPrefix as MentionUser[]) || (data.users as MentionUser[]) || [];
}