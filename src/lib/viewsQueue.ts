// Throttled view queue to reduce 429 from many /view calls at once.
// Sends one view every ~800ms, dedupes by postId within session.
// Uses /api/post-meta/:id/view with { postId, postType: 'post' }.

import { requestManager } from "./requestManager";

type Item = { postId: string; postType?: "post" | "ad" };

class ViewsQueue {
  private q: Item[] = [];
  private processing = false;
  private seen = new Set<string>(); // session dedupe
  private INTERVAL_MS = 800; // adjust if still rate-limited

  enqueue(postId: string, postType: "post" | "ad" = "post") {
    const key = `${postType}-${postId}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.q.push({ postId, postType });
    this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.q.length) {
      const item = this.q.shift()!;
      const token = localStorage.getItem("token");

      await requestManager.fetchJSON(
        `${import.meta.env.VITE_API_URL}/api/post-meta/${item.postId}/view`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ postId: item.postId, postType: item.postType || "post" }),
          retries: 1,
        }
      );

      // space out calls
      await new Promise((r) => setTimeout(r, this.INTERVAL_MS));
    }

    this.processing = false;
  }
}

export const viewsQueue = new ViewsQueue();