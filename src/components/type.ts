export interface MediaItem {
  url: string;
  type: string; // "image" | "video"
}

export interface Status {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isGoldenVerified?: boolean;
  content: string;
  contentType: "text" | "image" | "video";
  media?: MediaItem[];
  tags?: string[];
  privacy: "public" | "friends" | "private";
  createdAt: string;
  likeCount: number;
  viewCount: number;
  reactions: Record<string, number>;
  views?: string[];
}