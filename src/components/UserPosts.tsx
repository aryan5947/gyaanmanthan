import React from 'react';
import PostCard from './PostCard';

type Post = {
  id: number;
  title: string;
  author: string;
  date: string;
  excerpt: string;
};

type UserPostsProps = {
  posts: Post[];
};

export default function UserPosts({ posts }: UserPostsProps) {
  return (
    <div className="user-posts mt-6 flex flex-col gap-4">
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            author={post.author}
            date={post.date}
            excerpt={post.excerpt}
          />
        ))
      ) : (
        <p className="text-gray-500 italic">No posts yet.</p>
      )}
    </div>
  );
}
