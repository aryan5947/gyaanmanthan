/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_URL: string;
  // agar future me aur VITE_ vars add karte ho to yahan declare kar dena
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
