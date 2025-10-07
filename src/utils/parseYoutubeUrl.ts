export const getYoutubeEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);

    // Handle youtu.be short links
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }

    // Handle youtube.com links
    if (parsed.hostname.includes("youtube.com")) {
      // Handle /watch?v=VIDEO_ID
      if (parsed.pathname === "/watch") {
        const v = parsed.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : null;
      }

      // Handle /embed/VIDEO_ID
      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${parsed.pathname}`;
      }

      // Handle /shorts/VIDEO_ID
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      // Handle /live/VIDEO_ID
      if (parsed.pathname.startsWith("/live/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
};
