// RecentPosts.jsx
<div className="recent-posts">
  <h2>Recent Posts</h2>
  {posts.map(post => (
    <PostCard key={post.id} post={post} />
  ))}
</div>
