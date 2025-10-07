import React, { Suspense, lazy } from "react";
import "./FeedPage.css";

// Lazy load for performance
const PostDetailPage = lazy(() => import("../components/PostDetailPage"));

export default function FeedPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <header className="feed-header">
        <h2>📚 Gyaan Feed</h2>
      </header>

      {/* Directly render Full Details */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <PostDetailPage />
        </Suspense>
      </div>
    </div>
  );
}
