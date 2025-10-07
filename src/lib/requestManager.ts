// A minimal fetch manager with:
// - Concurrency limit
// - In-flight dedupe by request key (method+url+body)
// - Per-origin rate-limit cooldown honoring Retry-After
// - Exponential backoff with jitter for 429/502/503/504
// - Safe JSON parsing

type FetchJSONOpts = RequestInit & {
  key?: string;         // optional custom dedupe key
  retries?: number;     // default 2
  backoffBaseMs?: number; // default 800
  retryOn?: number[];   // default [429, 502, 503, 504]
};

type JSONResult<T = any> = {
  ok: boolean;
  status: number;
  headers: Headers;
  data?: T;
  text?: string;
  error?: string;
};

class RequestManager {
  private queue: Array<() => void> = [];
  private active = 0;
  private readonly MAX_CONCURRENCY = 2;

  // Dedupe for same request
  private inFlight = new Map<string, Promise<Response>>();

  // Per-origin cooldown after 429
  private originCooldown = new Map<string, number>(); // origin -> timestamp ms

  private now() {
    return Date.now();
  }

  private getOrigin(url: string) {
    try {
      return new URL(url, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }

  private async wait(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async schedule<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.MAX_CONCURRENCY) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }

  private buildKey(url: string, init?: RequestInit, custom?: string) {
    if (custom) return custom;
    const method = (init?.method || "GET").toUpperCase();
    let body = "";
    try {
      body = typeof init?.body === "string" ? init!.body as string : JSON.stringify(init?.body ?? "");
    } catch {
      body = "";
    }
    return `${method} ${url} ${body}`;
  }

  private async doFetch(url: string, init?: RequestInit): Promise<Response> {
    return this.schedule(async () => {
      return fetch(url, init);
    });
  }

  async fetchJSON<T = any>(url: string, opts: FetchJSONOpts = {}): Promise<JSONResult<T>> {
    const {
      key,
      retries = 2,
      backoffBaseMs = 800,
      retryOn = [429, 502, 503, 504],
      ...init
    } = opts;

    const requestKey = this.buildKey(url, init, key);
    const origin = this.getOrigin(url);

    // Respect origin cooldown (after a 429)
    const until = this.originCooldown.get(origin);
    if (until && this.now() < until) {
      const waitMs = until - this.now();
      return {
        ok: false,
        status: 429,
        headers: new Headers(),
        error: `Rate-limited. Try after ${Math.ceil(waitMs / 1000)}s`,
      };
    }

    // In-flight dedupe
    if (this.inFlight.has(requestKey)) {
      try {
        const res = await this.inFlight.get(requestKey)!;
        return await this.parseResponse<T>(url, res);
      } catch (e: any) {
        return { ok: false, status: 0, headers: new Headers(), error: e?.message || "Network error" };
      }
    }

    let attempt = 0;
    let lastErr: any;

    const run = async (): Promise<JSONResult<T>> => {
      // Check cooldown again before attempt
      const until2 = this.originCooldown.get(origin);
      if (until2 && this.now() < until2) {
        const waitMs = until2 - this.now();
        return {
          ok: false,
          status: 429,
          headers: new Headers(),
          error: `Rate-limited. Try after ${Math.ceil(waitMs / 1000)}s`,
        };
      }

      const p = this.doFetch(url, init);
      this.inFlight.set(requestKey, p);

      try {
        const res = await p;
        this.inFlight.delete(requestKey);

        if (retryOn.includes(res.status)) {
          if (res.status === 429) {
            // Set cooldown using Retry-After, fallback 60s
            const ra = res.headers.get("retry-after");
            let cooldownMs = 60000;
            if (ra) {
              const s = Number(ra);
              if (!isNaN(s) && s >= 0) cooldownMs = s * 1000;
            }
            this.originCooldown.set(origin, this.now() + cooldownMs);
          }

          if (attempt < retries) {
            const jitter = Math.floor(Math.random() * 200);
            const backoff = backoffBaseMs * Math.pow(2, attempt) + jitter;
            attempt++;
            await this.wait(backoff);
            return run();
          }
        }

        // Parse (even for non-OK, we try to extract message)
        return await this.parseResponse<T>(url, res);
      } catch (e: any) {
        this.inFlight.delete(requestKey);
        lastErr = e;
        if (attempt < retries) {
          const jitter = Math.floor(Math.random() * 200);
          const backoff = backoffBaseMs * Math.pow(2, attempt) + jitter;
          attempt++;
          await this.wait(backoff);
          return run();
        }
        return { ok: false, status: 0, headers: new Headers(), error: e?.message || "Network error" };
      }
    };

    return run();
  }

  private async parseResponse<T>(url: string, res: Response): Promise<JSONResult<T>> {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const data = await res.json();
        if (res.ok) return { ok: true, status: res.status, headers: res.headers, data };
        return { ok: false, status: res.status, headers: res.headers, error: data?.message || res.statusText, data };
      } catch {
        const text = await res.text().catch(() => "");
        return { ok: res.ok, status: res.status, headers: res.headers, text, error: res.ok ? undefined : res.statusText };
      }
    } else {
      const text = await res.text().catch(() => "");
      return { ok: res.ok, status: res.status, headers: res.headers, text, error: res.ok ? undefined : text || res.statusText };
    }
  }
}

export const requestManager = new RequestManager();