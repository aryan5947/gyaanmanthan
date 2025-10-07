import React, { useState, Suspense, lazy } from "react";
import "./FeedPage.css";

// Lazy load for performance (optional)
const FeedListComponent = lazy(() => import("../components/FeedListComponent"));
const PostDetailPage = lazy(() => import("../components/PostDetailPage"));

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<"posts" | "details">("posts");

  return (
    <div className="w-full h-full flex flex-col">
      <header className="feed-header">
        <h2>📚 Gyaan Feed</h2>
      </header>

      {/* Tabs */}
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          📄 All Posts
        </button>
        <button
          className={`tab-button ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          📜 Full Details
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          {activeTab === "posts" && <FeedListComponent />}
          {activeTab === "details" && <PostDetailPage />}
        </Suspense>
      </div>
    </div>
  );
}
