import React, { useEffect, useRef, useState, CSSProperties } from "react";

interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  highlight?: string;
  fontSize?: string;
  fontFamily?: string;
}

// Utility to normalize YouTube URLs
const getYoutubeEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        const v = parsed.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : null;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${parsed.pathname}`;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith("/live/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
};

// YouTubeEmbed with auto replay + improved fallback (thumbnail + link)
const YouTubeEmbed: React.FC<{ url: string; height?: number; align?: string }> = ({
  url,
  height,
  align,
}) => {
  const [fallback, setFallback] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Extract videoId
  useEffect(() => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "youtu.be") setVideoId(parsed.pathname.slice(1));
      else if (parsed.searchParams.get("v")) setVideoId(parsed.searchParams.get("v"));
      else {
        const parts = parsed.pathname.split("/");
        setVideoId(parts[2] || null);
      }
    } catch {
      setVideoId(null);
    }
  }, [url]);

  // Load YouTube IFrame API + attach player
  useEffect(() => {
    if (!videoId) return;

    // Load script if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      const el = document.getElementById(`yt-player-${videoId}`);
      if (!el) return;

      try {
        new (window as any).YT.Player(`yt-player-${videoId}`, {
          videoId,
          events: {
            onStateChange: (event: any) => {
              if (event.data === 0 || event.data === -1) {
                setFallback(true);
              }
            },
            onError: () => setFallback(true),
          },
        });
      } catch (e) {
        console.error("YT Player init error:", e);
        setFallback(true);
      }
    };

    return () => {
      try {
        (playerRef.current as any)?.destroy?.();
      } catch (e) {
        console.warn("YT cleanup error:", e);
      }
    };
  }, [videoId]);

  if (!videoId) return null;

  const isLive = url.includes("/live/");
  const replayUrl = `https://www.youtube.com/embed/${videoId}`;
  const youtubeLink = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div
      style={{
        textAlign: (align || "center") as CSSProperties["textAlign"],
        margin: "1rem 0",
        width: "100%",
        position: "relative",
      }}
    >
      {!fallback && isLive ? (
        <div
          id={`yt-player-${videoId}`}
          ref={playerRef}
          style={{ width: "100%", height: height || 400 }}
        />
      ) : !fallback ? (
        <iframe
          width="100%"
          height={height || 400}
          src={replayUrl}
          title="YouTube replay"
          frameBorder="0"
          style={{ borderRadius: "6px", display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setFallback(true)}
        ></iframe>
      ) : (
        <a
          href={youtubeLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: height || 200,
            background: "#111",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="YouTube thumbnail"
            style={{ maxHeight: 140, borderRadius: 6, marginBottom: 8 }}
          />
          ▶️ Watch on YouTube
        </a>
      )}

      {isLive && !fallback && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "red",
            color: "white",
            fontSize: "0.9rem",
            fontWeight: "bold",
            padding: "3px 8px",
            borderRadius: "4px",
          }}
        >
          🔴 LIVE
        </div>
      )}
    </div>
  );
};

export function renderContent(content: any[]) {
  if (!Array.isArray(content)) return null;

  const renderChildren = (children: CustomText[]) =>
    children.map((child, idx) => {
      let node: React.ReactNode = child.text;

      if (child.bold) node = <strong>{node}</strong>;
      if (child.italic) node = <em>{node}</em>;
      if (child.underline) node = <u>{node}</u>;
      if (child.strikethrough) node = <s>{node}</s>;

      return (
        <span
          key={idx}
          style={{
            color: child.color,
            backgroundColor: child.highlight,
            fontSize: child.fontSize,
            fontFamily: child.fontFamily,
          }}
        >
          {node}
        </span>
      );
    });

  return content.map((block: any, idx: number) => {
    const alignStyle: React.CSSProperties = { textAlign: block.align || "left" };

    switch (block.type) {
      case "paragraph":
        return (
          <p key={idx} style={alignStyle}>
            {renderChildren(block.children || [])}
          </p>
        );

      case "heading-one":
        return (
          <h1 key={idx} style={alignStyle}>
            {renderChildren(block.children || [])}
          </h1>
        );

      case "heading-two":
        return (
          <h2 key={idx} style={alignStyle}>
            {renderChildren(block.children || [])}
          </h2>
        );

      case "bulleted-list":
        return (
          <ul key={idx} style={alignStyle}>
            {(block.children || []).map((li: any, liIdx: number) => (
              <li key={liIdx}>{renderChildren(li.children || [])}</li>
            ))}
          </ul>
        );

      case "numbered-list":
        return (
          <ol key={idx} style={alignStyle}>
            {(block.children || []).map((li: any, liIdx: number) => (
              <li key={liIdx}>{renderChildren(li.children || [])}</li>
            ))}
          </ol>
        );

      case "image":
        return (
          <div key={idx} style={{ textAlign: block.align || "left", margin: "1rem 0" }}>
            <img
              src={block.url}
              alt="Embedded"
              style={{
                maxWidth: block.width || 400,
                height: block.height || "auto",
              }}
            />
          </div>
        );

      case "video":
        return (
          <div key={idx} style={{ textAlign: block.align || "left", margin: "1rem 0" }}>
            <video
              src={block.url}
              controls
              style={{
                maxWidth: block.width || 400,
                height: block.height || "auto",
              }}
            />
          </div>
        );

      case "youtube":
        return (
          <YouTubeEmbed
            key={idx}
            url={block.url}
            height={block.height}
            align={block.align}
          />
        );

           case "file":
        return (
          <div
            key={idx}
            style={{ textAlign: block.align || "left", margin: "0.5rem 0" }}
          >
            <a
              href={block.url}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 {block.fileName || "Download file"}
            </a>
          </div>
        );

      default:
        return (
          <p key={idx} style={alignStyle}>
            {renderChildren(block.children || [])}
          </p>
        );
    }
  });
}
