export async function safeFetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("Content-Type") || "";
  let data: any;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = { html: await res.text() };
  }
  return { ok: res.ok, status: res.status, data };
}