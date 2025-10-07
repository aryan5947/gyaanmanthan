// src/types/postMeta.ts
export interface PostMeta {
  _id: string;
  title?: string;
  description?: string;
  content: any;
  authorId?: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  isGoldenVerified?: boolean;
  createdAt?: string;
  status?: "active" | "restricted" | "blocked" | "deleted";
  stats: {
    views: number;
    likes: number;
    saves: number;
    comments: number;
    shares: number;
    reports: number;
  };
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
}
