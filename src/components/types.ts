// src/types.ts

export type UserType = {
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  website?: string;
  location?: string;
  stats: {
    posts: number;
    followers: number;
    following: number;
    likes?: number;
    saves?: number;
  };
  posts?: any[];
  savedPosts?: any[];
  likedPosts?: any[];
  followersList?: any[];
  followingList?: any[];
};
