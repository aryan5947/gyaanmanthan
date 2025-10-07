import React, { useEffect, useRef, useState, CSSProperties } from "react";

// --- Types ---
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

// --- Utility: Normalize YouTube URLs ---
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

// --- YouTubeEmbed: 100% Crash-proof (iframe only, NO API) ---
const YouTubeEmbed: React.FC<{ url: string; height?: number; align?: string }> = ({
  url,
  height,
  align,
}) => {
  const [videoId, setVideoId] = useState<string | null>(null);

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

  if (!videoId) return null;

  const embedUrl = getYoutubeEmbedUrl(url) || `https://www.youtube.com/embed/${videoId}`;
  const youtubeLink = `https://www.youtube.com/watch?v=${videoId}`;
  const isLive = url.includes("/live/");

  return (
    <div
      style={{
        textAlign: (align || "center") as CSSProperties["textAlign"],
        margin: "1rem 0",
        width: "100%",
        position: "relative",
      }}
    >
      <iframe
        width="100%"
        height={height || 400}
        src={embedUrl}
        title="YouTube replay"
        frameBorder="0"
        style={{ borderRadius: "6px", display: "block" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation"
        onError={(e) => {
          // Hide broken iframe, show fallback thumbnail
          const parent = (e.target as HTMLIFrameElement).parentElement;
          if (parent) parent.innerHTML = `
            <a href="${youtubeLink}" target="_blank" rel="noopener noreferrer"
              style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:${height || 200}px;background:#111;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
              <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="YouTube thumbnail" style="max-height:140px;border-radius:6px;margin-bottom:8px;" />
              ▶️ Watch on YouTube
            </a>
          `;
        }}
      ></iframe>

      {isLive && (
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

// --- Main: Robust Renderer ---
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
            wordBreak: "break-word",
            lineHeight: 1.5,
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
                borderRadius: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
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
                borderRadius: 6,
                background: "#000",
              }}
              onError={(e) => {
                (e.target as HTMLVideoElement).style.display = "none";
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontWeight: 500,
                background: "#f3f3f3",
                borderRadius: 6,
                padding: "5px 12px",
                textDecoration: "none",
                color: "#333",
              }}
            >
              <span role="img" aria-label="file" style={{ marginRight: 6 }}>
                📄
              </span>
              {block.fileName || "Download file"}
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