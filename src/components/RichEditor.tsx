import React, { useMemo, useState, useCallback } from "react";
import { getYoutubeEmbedUrl } from "../utils/parseYoutubeUrl";
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  RenderLeafProps,
  ReactEditor,
} from "slate-react";
import { withHistory } from "slate-history";
import {
  createEditor,
  Descendant,
  Transforms,
  Editor,
  Element as SlateElement,
  Path,
  BaseEditor,
} from "slate";
import Toolbar from "./Toolbar";
import "./RichEditor.css";

// --- Custom Slate Types ---
type ParagraphElement = { type: "paragraph"; align?: "left" | "center" | "right"; children: Descendant[] };
type HeadingOneElement = { type: "heading-one"; align?: "left" | "center" | "right"; children: Descendant[] };
type HeadingTwoElement = { type: "heading-two"; align?: "left" | "center" | "right"; children: Descendant[] };
type BulletedListElement = { type: "bulleted-list"; children: Descendant[] };
type NumberedListElement = { type: "numbered-list"; children: Descendant[] };
type ListItemElement = { type: "list-item"; children: Descendant[] };
type ImageElement = { type: "image"; url: string; align?: "left" | "center" | "right"; children: [{ text: "" }] };
type VideoElement = { type: "video"; url: string; align?: "left" | "center" | "right"; children: [{ text: "" }] };
type YouTubeElement = { type: "youtube"; url: string; align?: "left" | "center" | "right"; children: [{ text: "" }] };
type FileElement = { type: "file"; url: string; fileName?: string; align?: "left" | "center" | "right"; children: [{ text: "" }] };

type CustomElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement
  | ImageElement
  | VideoElement
  | YouTubeElement
  | FileElement;

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  highlight?: string;
  fontSize?: string;
  fontFamily?: string;
};

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// --- Media Plugin ---
const withMedia = (ed: Editor) => {
  const { isVoid } = ed;
  ed.isVoid = (element) =>
    (SlateElement.isElement(element) &&
      ["image", "video", "youtube", "file"].includes((element as any).type)) ||
    isVoid(element);
  return ed;
};

// --- Helper: Insert Media + Paragraph ---
export const insertMedia = (editor: Editor, element: CustomElement) => {
  // Insert media node
  Transforms.insertNodes(editor, element);

  // Find inserted node path
  const [nodeEntry] = Editor.nodes(editor, {
    match: (n) => SlateElement.isElement(n) && (n as any).type === element.type,
    mode: "lowest",
  });

  if (nodeEntry) {
    const [, path] = nodeEntry;
    const nextPath = Path.next(path);

    // Insert empty paragraph after media
    Transforms.insertNodes(
      editor,
      { type: "paragraph", children: [{ text: "" }] },
      { at: nextPath }
    );

    // Move cursor into new paragraph
    Transforms.select(editor, Editor.start(editor, nextPath));
  }
};

export default function RichEditor({ value, setValue }: { value: string; setValue: (val: string) => void }) {
  const editor = useMemo(() => withMedia(withHistory(withReact(createEditor() as ReactEditor))), []);
  const initialValue: Descendant[] = [{ type: "paragraph", children: [{ text: "" }] }];
  const [content, setContent] = useState<Descendant[]>(initialValue);
  const [selectedMediaPath, setSelectedMediaPath] = useState<Path | null>(null);

  const renderElement = useCallback(
    (props: RenderElementProps) => (
      <Element {...props} editor={editor} selectedMediaPath={selectedMediaPath} setSelectedMediaPath={setSelectedMediaPath} />
    ),
    [selectedMediaPath]
  );

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);

  const handleChange = (newValue: Descendant[]) => {
    setContent(newValue);
    try {
      setValue(JSON.stringify(newValue));
    } catch {}
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { selection } = editor;
    if (!selection) return;
    if (event.key === "Backspace") {
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          SlateElement.isElement(n) && ["image", "video", "youtube", "file"].includes((n as any).type),
      });
      if (match) {
        event.preventDefault();
        const [, path] = match;
        Transforms.removeNodes(editor, { at: path });
        setSelectedMediaPath(null);
      }
    }
  };

  return (
    <div className="rich-editor">
      <Slate editor={editor} initialValue={content} onChange={handleChange}>
        <Toolbar editor={editor} insertMedia={insertMedia} />
        <Editable
          className="editable"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Write your content here..."
          spellCheck
          autoFocus
          onKeyDown={handleKeyDown}
        />
      </Slate>
    </div>
  );
}

// --- Element Renderer ---
interface ElementProps extends RenderElementProps {
  editor: Editor;
  selectedMediaPath: Path | null;
  setSelectedMediaPath: React.Dispatch<React.SetStateAction<Path | null>>;
}

const Element = ({ attributes, children, element, editor, selectedMediaPath, setSelectedMediaPath }: ElementProps) => {
  const path = ReactEditor.findPath(editor, element);
  const isSelected = selectedMediaPath && Path.equals(path, selectedMediaPath);

  const handleDelete = () => {
    Transforms.removeNodes(editor, { at: path });
    setSelectedMediaPath(null);
  };

  const handleMouseDown: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMediaPath(path);
    Transforms.select(editor, Editor.range(editor, path));
  };

  switch (element.type) {
    case "paragraph":
      return <p {...attributes} style={{ textAlign: element.align || "left" }}>{children}</p>;
    case "heading-one":
      return <h1 {...attributes} style={{ textAlign: element.align || "left" }}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes} style={{ textAlign: element.align || "left" }}>{children}</h2>;
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "image":
    case "video":
    case "youtube":
    case "file": {
      const fileName = (element as any).fileName || "";
      let inner: React.ReactNode = null;

      if (element.type === "image")
        inner = <img src={(element as ImageElement).url} alt="Embedded" className="media-image" />;
      else if (element.type === "video")
        inner = <video src={(element as VideoElement).url} controls className="media-video" />;
      else if (element.type === "file")
        inner = (
          <div className="media-file-container">
            <a href={(element as FileElement).url} download={fileName || true} target="_blank" rel="noopener noreferrer" className="media-file-link">
              📄 {fileName || "Download file"}
            </a>
          </div>
        );
      else {
        const embed = getYoutubeEmbedUrl((element as YouTubeElement).url);
        inner = embed ? (
          <iframe
            src={embed}
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="media-youtube"
          />
        ) : (
          <div className="media-error">⚠️ Invalid YouTube URL</div>
        );
      }

      return (
        <div {...attributes} onMouseDown={handleMouseDown} contentEditable={false}>
          {isSelected && (
            <span className="media-toolbar">
              <button
                type="button"
                                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                ✂️
              </button>
            </span>
          )}
          {inner}
          {children}
        </div>
      );
    }
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// --- Leaf Renderer ---
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if ((leaf as any).bold) children = <strong>{children}</strong>;
  if ((leaf as any).italic) children = <em>{children}</em>;
  if ((leaf as any).underline) children = <u>{children}</u>;
  if ((leaf as any).strikethrough) children = <s>{children}</s>;

  const style: React.CSSProperties = {
    color: (leaf as any).color,
    backgroundColor: (leaf as any).highlight,
    fontSize: (leaf as any).fontSize,
    fontFamily: (leaf as any).fontFamily,
  };

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};
