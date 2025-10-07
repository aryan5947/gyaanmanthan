import React from 'react';

type UserStatsProps = {
  posts: number;
  followers: number;
  following: number;
};

export default function UserStats({ posts, followers, following }: UserStatsProps) {
  return (
    <div className="user-stats flex gap-6 text-sm text-gray-700 mt-4">
      <div><strong>{posts}</strong> Posts</div>
      <div><strong>{followers}</strong> Followers</div>
      <div><strong>{following}</strong> Following</div>
    </div>
  );
}
