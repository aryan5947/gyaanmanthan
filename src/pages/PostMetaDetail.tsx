import React, { Suspense, lazy } from "react";
import "./Page.css";

// Lazy load for performance
const PostMetaDetail = lazy(() => import("../components/PostMetaDetail"));
const FeedListComponent = lazy(() => import("../components/FeedListComponent"));

export default function FeedPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="feed-header">
        <h2 className="feed-title">📚 Gyaan Feed</h2>
      </header>

      <div className="flex-1 overflow-auto">
  <Suspense fallback={<div className="loading">Loading...</div>}>
    <div className="flex h-full">
      {/* ✅ Shared Post Detail */}
      <div className="flex-1 overflow-auto">
        <PostMetaDetail />
      </div>

      <hr className="divider" />

      {/* ✅ Full Feed */}
      <div className="flex-1 overflow-auto">
        <FeedListComponent />
      </div>
    </div>
  </Suspense>
</div>

    </div>
  );
}
