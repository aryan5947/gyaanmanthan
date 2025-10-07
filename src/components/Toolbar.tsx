// src/components/Toolbar.tsx
import React, { useRef } from "react";
import { Editor } from "slate";
import { useSlate } from "slate-react";
import {
  toggleMark,
  toggleBlock,
  insertLinkURL,
  setColor,
  setHighlight,
  setFontSize,
  setFontFamily,
  setAlign,
} from "./EditorCommands";
import { insertMedia } from "./RichEditor";
import "./Toolbar.css";

interface ToolbarProps {
  editor: Editor;
  insertMedia: typeof insertMedia;
}

export default function Toolbar({ editor }: ToolbarProps) {
  const imageRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const ed = useSlate();

  const handleMouseDown = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  const handleInsertImageURL = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    insertMedia(ed, { type: "image", url, children: [{ text: "" }] });
  };

  const handleInsertVideoURL = () => {
    const url = window.prompt("Enter video URL");
    if (!url) return;
    insertMedia(ed, { type: "video", url, children: [{ text: "" }] });
  };

  const handleInsertYouTube = () => {
    const url = window.prompt("Enter YouTube URL");
    if (!url) return;
    insertMedia(ed, { type: "youtube", url, children: [{ text: "" }] });
  };

  return (
    <div className="toolbar">
      {/* Text Styles */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleMark(ed, "bold"))}>B</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleMark(ed, "italic"))}>I</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleMark(ed, "underline"))}>U</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleMark(ed, "strikethrough"))}>S</button>

      {/* Headings */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleBlock(ed, "heading-one"))}>H1</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleBlock(ed, "heading-two"))}>H2</button>

      {/* Lists */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleBlock(ed, "bulleted-list"))}>• List</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => toggleBlock(ed, "numbered-list"))}>1. List</button>

      {/* Colors */}
      <input type="color" title="Text Color" onChange={(e) => setColor(ed, e.target.value)} />
      <input type="color" title="Highlight Color" onChange={(e) => setHighlight(ed, e.target.value)} />

      {/* Fonts */}
      <select title="Font Family" onChange={(e) => setFontFamily(ed, e.target.value)}>
        <option value="">Font</option>
        <option value="serif">Serif</option>
        <option value="sans-serif">Sans</option>
        <option value="monospace">Mono</option>
      </select>
      <select title="Font Size" onChange={(e) => setFontSize(ed, e.target.value + "px")}>
        <option value="">Size</option>
        <option value="14">14px</option>
        <option value="16">16px</option>
        <option value="18">18px</option>
        <option value="24">24px</option>
      </select>

      {/* Embeds */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => insertLinkURL(ed))}>🔗 Link URL</button>

      {/* File Upload */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => fileRef.current?.click())}>📄 Upload File</button>
      <input
        ref={fileRef}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              insertMedia(ed, {
                type: "file",
                url: reader.result,
                fileName: f.name,
                children: [{ text: "" }],
              });
            }
          };
          reader.readAsDataURL(f);
          e.currentTarget.value = "";
        }}
      />

      {/* Image Upload */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => handleInsertImageURL())}>🌐 Image URL</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => imageRef.current?.click())}>📁 Upload Image</button>
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              insertMedia(ed, { type: "image", url: reader.result, children: [{ text: "" }] });
            }
          };
          reader.readAsDataURL(f);
          e.currentTarget.value = "";
        }}
      />

      {/* Video Upload */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => handleInsertVideoURL())}>🌐 Video URL</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => videoRef.current?.click())}>📁 Upload Video</button>
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              insertMedia(ed, { type: "video", url: reader.result, children: [{ text: "" }] });
            }
          };
          reader.readAsDataURL(f);
          e.currentTarget.value = "";
        }}
      />

      {/* YouTube */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => handleInsertYouTube())}>▶️ YouTube</button>

      {/* Alignment */}
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => setAlign(ed, "left"))}>⏪ Left</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => setAlign(ed, "center"))}>⏺ Center</button>
      <button type="button" onMouseDown={(e) => handleMouseDown(e, () => setAlign(ed, "right"))}>⏩ Right</button>
    </div>
  );
}
