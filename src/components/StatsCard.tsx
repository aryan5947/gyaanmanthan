import React from 'react';

type StatsCardProps = {
  posts: number;
  followers: number;
  bookmarks: number;
};

export default function StatsCard({ posts, followers, bookmarks }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-300 hover:shadow-md transition">
      <h3 className="text-lg font-semibold text-blue-700 mb-2">📈 Your Stats</h3>
      <ul className="text-gray-700 space-y-1">
        <li><strong>{posts}</strong> Posts</li>
        <li><strong>{followers}</strong> Followers</li>
        <li><strong>{bookmarks}</strong> Bookmarks</li>
      </ul>
    </div>
  );
}
