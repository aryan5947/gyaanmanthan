// src/components/EditorCommands.ts
import {
  Editor,
  Transforms,
  Element as SlateElement,
  Node,
  Text,
  Descendant,
} from "slate";

type Align = "left" | "center" | "right";

export type ImageElement = {
  type: "image";
  url: string;
  width?: number;
  height?: number;
  align?: Align;
  children: Descendant[];
};

export type VideoElement = {
  type: "video";
  url: string;
  width?: number;
  height?: number;
  align?: Align;
  children: Descendant[];
};

export type YouTubeElement = {
  type: "youtube";
  url: string;
  width?: number;
  height?: number;
  align?: Align;
  children: Descendant[];
};

export type LinkElement = {
  type: "link";
  url: string;
  children: Descendant[];
};

export type ParagraphElement = {
  type: "paragraph";
  align?: Align;
  children: Descendant[];
};

export type CustomElement = ImageElement | VideoElement | YouTubeElement | LinkElement | ParagraphElement | any;

// ------------------ Marks & Blocks ------------------
export const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

export const toggleBlock = (editor: Editor, format: CustomElement["type"]) => {
  const isActive = isBlockActive(editor, format);
  Transforms.setNodes<CustomElement>(
    editor,
    { type: isActive ? "paragraph" : (format as CustomElement["type"]) },
    {
      match: (n) => SlateElement.isElement(n) && (n as CustomElement).type !== undefined,
      split: true,
    }
  );
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: (n: Node) => SlateElement.isElement(n) && (n as any).type === format,
  });
  return !!match;
};

// ------------------ Inline marks (color, highlight, font) ------------------
export const setColor = (editor: Editor, color: string) => {
  Editor.addMark(editor, "color", color);
};

export const setHighlight = (editor: Editor, color: string) => {
  Editor.addMark(editor, "highlight", color);
};

export const setFontSize = (editor: Editor, size: string) => {
  Editor.addMark(editor, "fontSize", size);
};

export const setFontFamily = (editor: Editor, font: string) => {
  Editor.addMark(editor, "fontFamily", font);
};

// ------------------ Alignment for blocks/media ------------------
export const setAlign = (editor: Editor, align: Align) => {
  Transforms.setNodes(
    editor,
    { align },
    {
      match: (n) => SlateElement.isElement(n) && (n as any).type !== undefined,
      mode: "lowest",
    }
  );
};

// ------------------ File picker helper ------------------
const openFilePicker = (
  accept: string,
  callback: (url: string, name?: string, mime?: string) => void
) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string, file.name, file.type);
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

// ------------------ Insert helpers (use Descendant objects) ------------------
export const insertLinkURL = (editor: Editor) => {
  const url = prompt("Enter external link:");
  if (!url) return;
  const node: Descendant = {
    type: "link",
    url,
    children: [{ text: "Link" }],
  };
  Transforms.insertNodes(editor, node);
};

export const insertLinkUpload = (editor: Editor) => {
  openFilePicker("*/*", (url, name, mime) => {
    const isImage = mime?.startsWith("image/");
    const node: Descendant = isImage
      ? { type: "image", url, children: [{ text: "" }] }
      : { type: "link", url, children: [{ text: name || "File" }] };
    Transforms.insertNodes(editor, node);
  });
};

export const insertImageURL = (editor: Editor) => {
  const url = prompt("Enter image URL:");
  if (!url) return;
  const node: Descendant = { type: "image", url, children: [{ text: "" }] };
  Transforms.insertNodes(editor, node);
};

export const insertImageUpload = (editor: Editor) => {
  openFilePicker("image/*", (url) => {
    const node: Descendant = { type: "image", url, children: [{ text: "" }] };
    Transforms.insertNodes(editor, node);
  });
};

export const insertYouTubeURL = (editor: Editor) => {
  const url = prompt("Enter YouTube embed URL:");
  if (!url) return;
  const node: Descendant = { type: "youtube", url, children: [{ text: "" }] };
  Transforms.insertNodes(editor, node);
};

export const insertVideoUpload = (editor: Editor) => {
  openFilePicker("video/*", (url) => {
    const node: Descendant = { type: "video", url, children: [{ text: "" }] };
    Transforms.insertNodes(editor, node);
  });
};
