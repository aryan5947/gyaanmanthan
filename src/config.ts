// Prefer Vite env: define VITE_API_BASE in your frontend .env (e.g., http://localhost:5000)
// If not set, it will default to same-origin (empty string), so fetch("/music/...") works via proxy.
const viteBase =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_BASE) || "";

export const API_BASE: string = viteBase || "";

// Optional small helper if you want to build full URLs safely:
// export const apiUrl = (path: string) =>
//   (API_BASE ? API_BASE.replace(/\/$/, "") : "") + path;