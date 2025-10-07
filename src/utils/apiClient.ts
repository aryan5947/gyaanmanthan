export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);

    // 429 case
    if (res.status === 429) {
      const text = await res.text();
      return { data: null, error: "Server busy, try again later" };
    }

    // JSON check
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = (await res.json()) as T;
      return { data: json, error: null };
    } else {
      const text = await res.text();
      return { data: null, error: text || "Unexpected response" };
    }
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
}
