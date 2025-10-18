export type Provider = "spotify" | "deezer" | "youtube" | "soundcloud" | "unknown";

export interface Track {
  id: string;
  provider: Provider;
  providerId?: string;
  title: string;
  artists: string[];
  coverArt?: string;
  externalUrl?: string;
  playableUrl?: string | null;
  hasPreview?: boolean;
}