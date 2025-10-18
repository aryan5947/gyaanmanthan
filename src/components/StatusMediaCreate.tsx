import React, { useState, useRef, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  XMarkIcon, ArrowsRightLeftIcon, SparklesIcon, PencilIcon, Bars3Icon,
  Square2StackIcon, FaceSmileIcon, ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon, GifIcon, SunIcon, RadioIcon, GlobeAltIcon,
  QuestionMarkCircleIcon, StarIcon
} from "@heroicons/react/24/outline";
import "./StatusMediaCreate.css";

// Fixed preview stage so UI doesn't jump after upload
const STAGE_W = 360;
const STAGE_H = 360;

// ---------- Modal ----------
type OptionModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};
function OptionModal({ open, title, children, onClose }: OptionModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="option-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="option-modal" onClick={(e) => e.stopPropagation()}>
        <div className="option-modal-header">
          <span>{title}</span>
          <button type="button" onClick={onClose} aria-label="Close modal" className="modal-close-icon-btn">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="option-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ---------- Types ----------
type OverlayItemBase = { id: string; x: number; y: number; size: number; rotation?: number; };
type OverlayText = OverlayItemBase & { kind: "text"; text: string; color: string };
type OverlayEmoji = OverlayItemBase & { kind: "emoji"; emoji: string };
type OverlaySticker = OverlayItemBase & { kind: "sticker"; src: string };
type OverlayItem = OverlayText | OverlayEmoji | OverlaySticker;

const STATUS_MEDIA_LIMIT = 10;
const STATUS_FILE_SIZE_LIMIT = 15 * 1024 * 1024;
const apiBase = `${import.meta.env.VITE_API_URL}/api`;
const tenorKey = import.meta.env.VITE_TENOR_API_KEY as string | undefined;

// Example stickers
const DEFAULT_STICKERS = [
  "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/react.svg",
  "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/javascript.svg",
  "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/typescript.svg",
];

export default function StatusMediaCreateAdvanced() {
  const navigate = useNavigate();

  // Core
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [gifUrl, setGifUrl] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [expiry, setExpiry] = useState("24h");
  const [altText, setAltText] = useState("");
  const captionInputRef = useRef<HTMLInputElement>(null);

  // Canvas editing (images only)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ff3b3b");
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Filters
  const [fltBrightness, setFltBrightness] = useState(100);
  const [fltContrast, setFltContrast] = useState(100);
  const [fltSaturation, setFltSaturation] = useState(100);
  const [fltSepia, setFltSepia] = useState(0);
  const [fltInvert, setFltInvert] = useState(0);
  const [fltBlur, setFltBlur] = useState(0);

  // Overlays (images only)
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  // Modals (caption is inline; keep others)
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAltTextModal, setShowAltTextModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

  // Poll
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["Yes", "No"]);

  // Text overlay modal
  const [textOverlay, setTextOverlay] = useState("");
  const [textSize, setTextSize] = useState(40);
  const [textColor, setTextColor] = useState("#ffffff");

  // Emoji modal
  const [emojiInput, setEmojiInput] = useState("😊");
  const [emojiSize, setEmojiSize] = useState(72);

  // GIF modal
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<{ url: string; tiny: string }[]>([]);
  const [gifPasteUrl, setGifPasteUrl] = useState("");

  // Shape modal
  const [shapeStroke, setShapeStroke] = useState(4);

  // Mobile tools modal
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  const selectedType = mediaFiles[0]?.type || "";
  const isImage = !!selectedType && selectedType.startsWith("image/");
  const isVideo = !!selectedType && selectedType.startsWith("video/");
  const isAudio = !!selectedType && selectedType.startsWith("audio/");
  const isGif = !!gifUrl && !mediaFiles.length;

  const getPreviewUrl = () =>
    mediaFiles.length > 0 ? URL.createObjectURL(mediaFiles[0]) : gifUrl || "";

  // Utility: draw given image "contain" into fixed stage
  function drawImageToStage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, withFilter = false) {
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    if (withFilter) {
      ctx.filter = `brightness(${fltBrightness}%) contrast(${fltContrast}%) saturate(${fltSaturation}%) sepia(${fltSepia}%) invert(${fltInvert}%) blur(${fltBlur}px)`;
    } else {
      ctx.filter = "none";
    }
    const scale = Math.min(STAGE_W / img.width, STAGE_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (STAGE_W - dw) / 2;
    const dy = (STAGE_H - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = "none";
  }

  // Load image into fixed stage
  useEffect(() => {
    if (isImage && canvasRef.current) {
      const img = new Image();
      img.src = URL.createObjectURL(mediaFiles[0]);
      img.onload = () => {
        setBaseImage(img);
        const c = canvasRef.current!;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        c.width = STAGE_W;
        c.height = STAGE_H;
        drawImageToStage(ctx, img, false);
        resetFilters();
        resetHistory();
        setOverlayItems([]);
      };
    }
  }, [isImage, mediaFiles]);

  // Helpers
  const resetFilters = () => {
    setFltBrightness(100);
    setFltContrast(100);
    setFltSaturation(100);
    setFltSepia(0);
    setFltInvert(0);
    setFltBlur(0);
  };
  const resetHistory = () => {
    setUndoStack([]);
    setRedoStack([]);
  };
  const applyFiltersAndRedraw = () => {
    if (!canvasRef.current || !baseImage) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawImageToStage(ctx, baseImage, true);
  };
  const updateBaseFromCanvas = () => {
    if (!canvasRef.current) return;
    const img = new Image();
    img.src = canvasRef.current.toDataURL("image/png");
    img.onload = () => setBaseImage(img);
  };
  async function canvasToFile(canvas: HTMLCanvasElement, nameHint = "image.png"): Promise<File | null> {
    return new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) return resolve(null);
          const base = nameHint.replace(/\.[^/.]+$/, "");
          const file = new File([blob], `${base}-edited.png`, { type: "image/png" });
          resolve(file);
        }, "image/png", 0.92);
      } catch (e) {
        resolve(null);
      }
    });
  }
  // History
  const pushUndo = () => {
    if (!canvasRef.current) return;
    setUndoStack((s) => [...s, canvasRef.current!.toDataURL()]);
    setRedoStack([]);
  };
  const handleUndo = () => {
    if (!canvasRef.current || undoStack.length === 0) return;
    setRedoStack((s) => [canvasRef.current!.toDataURL(), ...s]);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.src = prev;
    img.onload = () => {
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      ctx.drawImage(img, 0, 0, STAGE_W, STAGE_H);
      setBaseImage(img);
    };
  };
  const handleRedo = () => {
    if (!canvasRef.current || redoStack.length === 0) return;
    pushUndo();
    const next = redoStack[0];
    setRedoStack((s) => s.slice(1));
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.src = next;
    img.onload = () => {
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      ctx.drawImage(img, 0, 0, STAGE_W, STAGE_H);
      setBaseImage(img);
    };
  };

  // Draw (images only)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setDrawPoints([{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }]);
    pushUndo();
  };
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawPoints.length === 0) return;
    setDrawPoints((pts) => [...pts, { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }]);
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const prev = drawPoints[drawPoints.length - 1];
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };
  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setDrawPoints([]);
    updateBaseFromCanvas();
  };

  // Overlay drag
  const onOverlayMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const wrap = previewWrapperRef.current;
    if (!wrap) return;
    const item = overlayItems.find((i) => i.id === id);
    if (!item) return;
    const rect = wrap.getBoundingClientRect();
    setSelectedOverlayId(id);
    setDraggingId(id);
    setDragOffset({ dx: e.clientX - (rect.left + item.x), dy: e.clientY - (rect.top + item.y) });
  };
  const onOverlayMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const wrap = previewWrapperRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const nx = e.clientX - rect.left - dragOffset.dx;
    const ny = e.clientY - rect.top - dragOffset.dy;
    setOverlayItems((items) =>
      items.map((it) =>
        it.id === draggingId
          ? { ...it, x: Math.max(0, Math.min(nx, rect.width - it.size)), y: Math.max(0, Math.min(ny, rect.height - it.size)) }
          : it
      )
    );
  };
  const endDragging = () => setDraggingId(null);

  // Rotate base image 90° and re-fit to stage
  const rotate90 = () => {
    if (!isImage || !baseImage || !canvasRef.current) return;
    pushUndo();
    const off = document.createElement("canvas");
    off.width = baseImage.height;
    off.height = baseImage.width;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.translate(off.width / 2, off.height / 2);
    octx.rotate(Math.PI / 2);
    octx.drawImage(baseImage, -baseImage.width / 2, -baseImage.height / 2);
    const data = off.toDataURL("image/png");
    const rotated = new Image();
    rotated.onload = () => {
      setBaseImage(rotated);
      const ctx = canvasRef.current!.getContext("2d");
      if (!ctx) return;
      drawImageToStage(ctx, rotated, false);
    };
    rotated.src = data;
  };

  // Toolbar actions
  const handleToolbarAction = async (action: string) => {
    switch (action) {
      case "close":
        // reset local states
        setMediaFiles([]);
        setGifUrl("");
        setCaption("");
        setTags("");
        setAltText("");
        resetFilters();
        resetHistory();
        setBaseImage(null);
        setOverlayItems([]);
        // navigate away (close screen)
        try {
          navigate(-1);
        } catch {
          if (typeof window !== "undefined") window.history.back();
        }
        break;
      case "rotate":
        rotate90();
        break;
      case "filter":
        if (isImage) setShowFilterModal(true);
        break;
      case "draw":
        if (isImage) setIsDrawing((v) => !v);
        break;
      case "text":
        if (isImage) setShowTextModal(true);
        break;
      case "emoji":
        if (isImage) setShowEmojiModal(true);
        break;
      case "sticker":
        if (isImage) setShowStickerModal(true);
        break;
      case "gif":
        setShowGifModal(true);
        break;
      case "shape":
        if (isImage) setShowShapeModal(true);
        break;
      case "download":
        downloadCurrent();
        break;
      case "undo":
        handleUndo();
        break;
      case "redo":
        handleRedo();
        break;
      case "location":
        navigator.geolocation.getCurrentPosition((pos) => {
          setLocation(`Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`);
        });
        break;
      case "caption":
        captionInputRef.current?.focus();
        break;
      case "tags":
        setShowTagsModal(true);
        break;
      case "privacy":
        setShowPrivacyModal(true);
        break;
      case "altText":
        setShowAltTextModal(true);
        break;
      case "poll":
        setShowPollModal(true);
        break;
      default:
        break;
    }
  };

  // Download
  const downloadCurrent = async () => {
    if (isImage && canvasRef.current) {
      if (overlayItems.length) await commitOverlays();
      const a = document.createElement("a");
      a.href = canvasRef.current.toDataURL("image/png");
      a.download = "edited-image.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const url = getPreviewUrl();
      const a = document.createElement("a");
      a.href = url;
      a.download = mediaFiles[0]?.name || (gifUrl ? "status.gif" : "media");
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  // Files
  function handleFilesChanged(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    let validFiles: File[] = [];
    let errors: string[] = [];
    files.forEach((file) => {
      if (!(file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/"))) {
        errors.push(`Unsupported file type: ${file.name}`);
      } else if (file.size > STATUS_FILE_SIZE_LIMIT) {
        errors.push(`File too large (max 15MB): ${file.name}`);
      } else {
        validFiles.push(file);
      }
    });
    if (mediaFiles.length + validFiles.length > STATUS_MEDIA_LIMIT) {
      errors.push(`You can upload up to ${STATUS_MEDIA_LIMIT} files.`);
      validFiles = validFiles.slice(0, STATUS_MEDIA_LIMIT - mediaFiles.length);
    }
    setError(errors.length ? errors.join("\n") : null);
    setMediaFiles([...mediaFiles, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  function removeMediaFile(idx: number) {
    setMediaFiles((arr) => arr.filter((_, i) => i !== idx));
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("content", caption);
      formData.append("contentType", mediaFiles[0]?.type?.startsWith("video") ? "video" : "image");

      // IMPORTANT: If editing image, export canvas result
      if (isImage && canvasRef.current) {
        if (overlayItems.length) {
          await commitOverlays();
        }
        const editedFile = await canvasToFile(canvasRef.current, mediaFiles[0]?.name || "image.png");

        if (editedFile) {
          formData.append("files", editedFile);
          mediaFiles.slice(1).forEach((file) => formData.append("files", file));
        } else {
          mediaFiles.forEach((file) => formData.append("files", file));
        }
      } else {
        mediaFiles.forEach((file) => formData.append("files", file));
      }

      audioFiles.forEach((file) => formData.append("audio", file));
      if (gifUrl) formData.append("gif", gifUrl);
      formData.append("privacy", privacy);
      if (tags.trim().length) formData.append("tags", tags);
      if (location) formData.append("location", location);
      if (altText) formData.append("altText", altText);
      formData.append("expiry", expiry);
      if (pollQuestion) formData.append("pollQuestion", pollQuestion);
      formData.append("pollOptions", JSON.stringify(pollOptions));

      const token = localStorage.getItem("token");
      const res = await axios.post(`${apiBase}/status`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.data.ok) {
        setMediaFiles([]);
        setTags("");
        setCaption("");
        setPrivacy("public");
        setSuccess("Media status posted successfully!");
      } else {
        setError(res.data.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to post status");
    } finally {
      setLoading(false);
    }
  }

  // Overlays (images only)
  const addTextOverlay = (text: string, size: number, color: string) => {
    if (!isImage || !previewWrapperRef.current || !text.trim()) return;
    const rect = previewWrapperRef.current.getBoundingClientRect();
    setOverlayItems((items) => [
      ...items,
      { id: crypto.randomUUID(), kind: "text", text, color, size, x: rect.width / 2 - size, y: rect.height / 2 - size } as OverlayText,
    ]);
  };
  const addEmojiOverlay = (emoji: string, size: number) => {
    if (!isImage || !previewWrapperRef.current || !emoji.trim()) return;
    const rect = previewWrapperRef.current.getBoundingClientRect();
    setOverlayItems((items) => [
      ...items,
      { id: crypto.randomUUID(), kind: "emoji", emoji, size, x: rect.width / 2 - size / 2, y: rect.height / 2 - size / 2 } as OverlayEmoji,
    ]);
  };
  const addStickerOverlay = (src: string, size = 128) => {
    if (!isImage || !previewWrapperRef.current) return;
    const rect = previewWrapperRef.current.getBoundingClientRect();
    setOverlayItems((items) => [
      ...items,
      { id: crypto.randomUUID(), kind: "sticker", src, size, x: rect.width / 2 - size / 2, y: rect.height / 2 - size / 2 } as OverlaySticker,
    ]);
  };

  // Commit overlays onto canvas
  const commitOverlays = async () => {
    if (!isImage || !canvasRef.current) return;
    pushUndo();
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const wrap = previewWrapperRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const scaleX = STAGE_W / rect.width;
    const scaleY = STAGE_H / rect.height;

    for (const it of overlayItems) {
      if (it.kind === "text") {
        const t = it as OverlayText;
        ctx.save();
        ctx.font = `bold ${t.size * scaleY}px sans-serif`;
        ctx.fillStyle = t.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 6;
        ctx.fillText(t.text, it.x * scaleX, it.y * scaleY);
        ctx.restore();
      } else if (it.kind === "emoji") {
        const e = it as OverlayEmoji;
        ctx.save();
        ctx.font = `${e.size * scaleY}px serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(e.emoji, it.x * scaleX, it.y * scaleY);
        ctx.restore();
      } else if (it.kind === "sticker") {
        const s = it as OverlaySticker;
        const img = await loadImage(s.src);
        ctx.drawImage(img, it.x * scaleX, it.y * scaleY, it.size * scaleX, it.size * scaleY);
      }
    }
    setOverlayItems([]);
    updateBaseFromCanvas();
  };

  const deleteSelectedOverlay = () => {
    if (!selectedOverlayId) return;
    setOverlayItems((items) => items.filter((i) => i.id !== selectedOverlayId));
    setSelectedOverlayId(null);
  };

  // GIF search
  const searchGifs = async (q: string) => {
    if (!q.trim()) return;
    if (!tenorKey) {
      setError("No Tenor API key set (VITE_TENOR_API_KEY). Use URL instead.");
      return;
    }
    try {
      setError(null);
      const resp = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${tenorKey}&limit=24&media_filter=gif,tinygif`
      );
      const data = await resp.json();
      const items: { url: string; tiny: string }[] = (data.results || []).map((r: any) => ({
        url: r.media_formats?.gif?.url || "",
        tiny: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || "",
      }));
      setGifResults(items.filter((i) => i.url));
    } catch (e: any) {
      setError(e?.message || "Failed to search GIFs");
    }
  };

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="status-form status-media-create-advanced"
      style={{ ["--stage-w" as any]: `${STAGE_W}px`, ["--stage-h" as any]: `${STAGE_H}px` }}
    >
      {/* Floating Close (top-left) */}
      <button
        type="button"
        className="status-close-btn"
        title="Close"
        onClick={() => handleToolbarAction("close")}
        disabled={loading}
        aria-label="Close"
      >
        <XMarkIcon className="h-7 w-7" />
      </button>

      {/* Mobile: Feature trigger (opens tools modal) */}
      {isMobile && (
        <button
          type="button"
          className="feature-modal-trigger"
          title="Tools"
          onClick={() => setShowFeatureModal(true)}
          aria-label="Open tools"
        >
          <SparklesIcon className="h-6 w-6" />
        </button>
      )}

      {/* Mobile tools modal */}
      <OptionModal
        open={isMobile && showFeatureModal}
        title="Editing Tools"
        onClose={() => setShowFeatureModal(false)}
      >
        <div className="tools-grid">
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("rotate"); setShowFeatureModal(false); }}>
            <ArrowsRightLeftIcon className="h-7 w-7" /><span>Rotate</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("filter"); setShowFeatureModal(false); }} disabled={!isImage}>
            <SparklesIcon className="h-7 w-7" /><span>Filter</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("draw"); setShowFeatureModal(false); }} disabled={!isImage}>
            <PencilIcon className="h-7 w-7" /><span>Draw</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("text"); setShowFeatureModal(false); }} disabled={!isImage}>
            <Bars3Icon className="h-7 w-7" /><span>Text</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("shape"); setShowFeatureModal(false); }} disabled={!isImage}>
            <Square2StackIcon className="h-7 w-7" /><span>Shape</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("emoji"); setShowFeatureModal(false); }} disabled={!isImage}>
            <FaceSmileIcon className="h-7 w-7" /><span>Emoji</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("sticker"); setShowFeatureModal(false); }} disabled={!isImage}>
            <ChatBubbleLeftRightIcon className="h-7 w-7" /><span>Sticker</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("gif"); setShowFeatureModal(false); }}>
            <GifIcon className="h-7 w-7" /><span>GIF</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("download"); setShowFeatureModal(false); }}>
            <ArrowDownTrayIcon className="h-7 w-7" /><span>Download</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("undo"); setShowFeatureModal(false); }}>
            <SunIcon className="h-7 w-7" /><span>Undo</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("redo"); setShowFeatureModal(false); }}>
            <RadioIcon className="h-7 w-7" /><span>Redo</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("location"); setShowFeatureModal(false); }}>
            <GlobeAltIcon className="h-7 w-7" /><span>Location</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("poll"); setShowFeatureModal(false); }}>
            <QuestionMarkCircleIcon className="h-7 w-7" /><span>Poll</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("tags"); setShowFeatureModal(false); }}>
            <StarIcon className="h-7 w-7" /><span>Tags</span>
          </button>
          <button className="tool-btn" type="button" onClick={() => { handleToolbarAction("privacy"); setShowFeatureModal(false); }}>
            <GlobeAltIcon className="h-7 w-7" /><span>Privacy</span>
          </button>
        </div>
      </OptionModal>

      <div className="media-full-preview-area">
        {/* Toolbar (desktop only; hidden on mobile via CSS) */}
        <div className="media-toolbar">
          <button type="button" title="Close" onClick={() => handleToolbarAction("close")} disabled={loading}><XMarkIcon className="h-6 w-6" /></button>
          <button type="button" title="Rotate (images only)" onClick={() => handleToolbarAction("rotate")} disabled={loading || !isImage}><ArrowsRightLeftIcon className="h-6 w-6" /></button>
          <button type="button" title="Filter (images only)" onClick={() => handleToolbarAction("filter")} disabled={loading || !isImage}><SparklesIcon className="h-6 w-6" /></button>
          <button type="button" title="Draw (images only)" onClick={() => handleToolbarAction("draw")} disabled={loading || !isImage}><PencilIcon className="h-6 w-6" /></button>
          <button type="button" title="Text (images only)" onClick={() => handleToolbarAction("text")} disabled={loading || !isImage}><Bars3Icon className="h-6 w-6" /></button>
          <button type="button" title="Shape (images only)" onClick={() => handleToolbarAction("shape")} disabled={loading || !isImage}><Square2StackIcon className="h-6 w-6" /></button>
          <button type="button" title="Emoji (images only)" onClick={() => handleToolbarAction("emoji")} disabled={loading || !isImage}><FaceSmileIcon className="h-6 w-6" /></button>
          <button type="button" title="Sticker (images only)" onClick={() => handleToolbarAction("sticker")} disabled={loading || !isImage}><ChatBubbleLeftRightIcon className="h-6 w-6" /></button>
          <button type="button" title="GIF" onClick={() => handleToolbarAction("gif")} disabled={loading}><GifIcon className="h-6 w-6" /></button>
          <button type="button" title="Download" onClick={() => handleToolbarAction("download")} disabled={loading || (!mediaFiles.length && !gifUrl)}><ArrowDownTrayIcon className="h-6 w-6" /></button>
          <button type="button" title="Undo" onClick={() => handleToolbarAction("undo")} disabled={loading}><SunIcon className="h-6 w-6" /></button>
          <button type="button" title="Redo" onClick={() => handleToolbarAction("redo")} disabled={loading}><RadioIcon className="h-6 w-6" /></button>
          <button type="button" title="Location" onClick={() => handleToolbarAction("location")} disabled={loading}><GlobeAltIcon className="h-6 w-6" /></button>
          <button type="button" title="Poll" onClick={() => handleToolbarAction("poll")} disabled={loading}><QuestionMarkCircleIcon className="h-6 w-6" /></button>
          <button type="button" title="Caption (focus below bar)" onClick={() => handleToolbarAction("caption")} disabled={loading}><Bars3Icon className="h-6 w-6" /></button>
          <button type="button" title="Tags" onClick={() => handleToolbarAction("tags")} disabled={loading}><StarIcon className="h-6 w-6" /></button>
          <button type="button" title="Privacy" onClick={() => handleToolbarAction("privacy")} disabled={loading}><GlobeAltIcon className="h-6 w-6" /></button>
        </div>

        {/* Stage + caption wrapper ensures same width */}
        <div className="stage-shell" onMouseMove={onOverlayMouseMove} onMouseUp={endDragging} onMouseLeave={endDragging}>
          <div className="media-main-preview">
            <div className="canvas-wrap" ref={previewWrapperRef}>
              {isGif && <img src={gifUrl} alt="GIF" className="stage-media" />}
              {isImage && (
                <canvas
                  ref={canvasRef}
                  className="stage-media"
                  width={STAGE_W}
                  height={STAGE_H}
                  onMouseDown={isDrawing ? handleCanvasMouseDown : undefined}
                  onMouseMove={isDrawing ? handleCanvasMouseMove : undefined}
                  onMouseUp={isDrawing ? handleCanvasMouseUp : undefined}
                />
              )}
              {isVideo && (
                <video src={getPreviewUrl()} className="stage-media" controls />
              )}

              {isImage && !!overlayItems.length && (
                <div className="overlay-layer" onMouseDown={() => setSelectedOverlayId(null)}>
                  {overlayItems.map((it) => (
                    <div
                      key={it.id}
                      className={`overlay-item ${selectedOverlayId === it.id ? "selected" : ""}`}
                      style={{ left: it.x, top: it.y, fontSize: it.size, lineHeight: 1 }}
                      onMouseDown={(e) => onOverlayMouseDown(e, it.id)}
                      title="Drag to position"
                    >
                      {it.kind === "text" && (
                        <span style={{ color: (it as OverlayText).color, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                          {(it as OverlayText).text}
                        </span>
                      )}
                      {it.kind === "emoji" && <span>{(it as OverlayEmoji).emoji}</span>}
                      {it.kind === "sticker" && (
                        <img
                          src={(it as OverlaySticker).src}
                          alt="sticker"
                          style={{ width: it.size, height: it.size, objectFit: "contain", pointerEvents: "none" }}
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inline caption bar (always visible, below stage) */}
          <div className="caption-inline">
            <input
              ref={captionInputRef}
              className="caption-input-inline"
              type="text"
              placeholder="Add a caption"
              maxLength={250}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <button type="button" className="caption-emoji-btn" onClick={() => setShowEmojiModal(true)} title="Add emoji">
              <FaceSmileIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Overlay tools (desktop assist) */}
        {isImage && !!overlayItems.length && (
          <div className="overlay-toolbar">
            <button type="button" className="media-btn" onClick={commitOverlays}>Commit overlays</button>
            <button type="button" className="media-btn" onClick={() => setOverlayItems([])}>Clear overlays</button>
            {selectedOverlayId && (
              <button type="button" className="media-btn" onClick={deleteSelectedOverlay}>Delete selected</button>
            )}
          </div>
        )}

        {/* Thumbnails */}
        <div className="media-thumbnail-bar">
          {mediaFiles.map((file, idx) => (
            <div key={idx} className={`media-thumb-bar-item${idx === 0 ? " selected" : ""}`}>
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="media-thumb-small"
                  onClick={() => {
                    setMediaFiles((arr) => {
                      const newArr = [...arr];
                      const [selected] = newArr.splice(idx, 1);
                      newArr.unshift(selected);
                      return newArr;
                    });
                  }}
                />
              ) : file.type.startsWith("video/") ? (
                <video
                  src={URL.createObjectURL(file)}
                  className="media-thumb-small"
                  onClick={() => {
                    setMediaFiles((arr) => {
                      const newArr = [...arr];
                      const [selected] = newArr.splice(idx, 1);
                      newArr.unshift(selected);
                      return newArr;
                    });
                  }}
                />
              ) : file.type.startsWith("audio/") ? (
                <audio src={URL.createObjectURL(file)} className="media-thumb-small" controls />
              ) : null}
              <button type="button" className="remove-media-btn" onClick={() => removeMediaFile(idx)} disabled={loading} title="Remove">
                &times;
              </button>
            </div>
          ))}
          {mediaFiles.length < STATUS_MEDIA_LIMIT && (
            <label className="media-thumb-bar-add">
              +
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFilesChanged}
                disabled={loading || mediaFiles.length >= STATUS_MEDIA_LIMIT}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>

        {location && <div>Location tagged: {location}</div>}
        {error && <div className="form-error">{error}</div>}
        {success && <div style={{ color: "green" }}>{success}</div>}

        {/* Modals */}

        
        <OptionModal open={showTagsModal} title="Add Tags" onClose={() => setShowTagsModal(false)}>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} maxLength={100} placeholder="Tags (comma separated)" />
          <button className="media-btn" type="button" onClick={() => setShowTagsModal(false)}>Done</button>
        </OptionModal>

        <OptionModal open={showPrivacyModal} title="Privacy" onClose={() => setShowPrivacyModal(false)}>
          <select value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="private">Private</option>
            <option value="custom">Custom Audience</option>
          </select>
          <button className="media-btn" type="button" onClick={() => setShowPrivacyModal(false)}>Done</button>
        </OptionModal>

        <OptionModal open={showAltTextModal} title="Alt Text" onClose={() => setShowAltTextModal(false)}>
          <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)} maxLength={120} placeholder="Alt text (for accessibility)" />
          <button className="media-btn" type="button" onClick={() => setShowAltTextModal(false)}>Done</button>
        </OptionModal>

        <OptionModal open={showTextModal} title="Add Text Overlay" onClose={() => setShowTextModal(false)}>
          <input type="text" value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Enter text" />
          <div className="row">
            <label>Size</label>
            <input type="range" min={14} max={180} value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} />
            <span>{textSize}px</span>
          </div>
          <div className="row">
            <label>Color</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </div>
          <button className="media-btn" type="button" onClick={() => { addTextOverlay(textOverlay, textSize, textColor); setShowTextModal(false); }} disabled={!isImage}>
            Add Text
          </button>
        </OptionModal>

        <OptionModal open={showEmojiModal} title="Add Emoji" onClose={() => setShowEmojiModal(false)}>
          <input type="text" value={emojiInput} onChange={(e) => setEmojiInput(e.target.value)} placeholder="Type or paste emoji (e.g., 😊)" aria-label="Emoji input" />
          <div className="emoji-grid">
            {["😀","😁","😂","🥲","😊","😍","😘","😎","🤩","🤔","🤯","😴","🤤","😡","👍","🙏","🔥","✨","💖","💯","✅","❌","🎉","🎶","📍"].map((e) => (
              <button key={e} type="button" className="emoji-btn" onClick={() => setEmojiInput(e)}>{e}</button>
            ))}
          </div>
          <div className="row">
            <label>Size</label>
            <input type="range" min={24} max={200} value={emojiSize} onChange={(e) => setEmojiSize(parseInt(e.target.value))} />
            <span>{emojiSize}px</span>
          </div>
          <button className="media-btn" type="button" onClick={() => { addEmojiOverlay(emojiInput || "😊", emojiSize); setShowEmojiModal(false); }} disabled={!isImage}>
            Add Emoji
          </button>
        </OptionModal>

        <OptionModal open={showStickerModal} title="Sticker Library" onClose={() => setShowStickerModal(false)}>
          <div className="gif-grid">
            {DEFAULT_STICKERS.map((s, i) => (
              <button key={i} type="button" className="gif-item" onClick={() => { addStickerOverlay(s, 128); setShowStickerModal(false); }}>
                <img src={s} alt="sticker" />
              </button>
            ))}
          </div>
          <div className="row">
            <input type="url" placeholder="Paste sticker image URL" onChange={(e) => setGifPasteUrl(e.target.value)} value={gifPasteUrl} />
            <button className="media-btn" type="button" onClick={() => { if (gifPasteUrl.trim()) { addStickerOverlay(gifPasteUrl.trim(), 128); setGifPasteUrl(""); setShowStickerModal(false); } }}>
              Add URL
            </button>
          </div>
        </OptionModal>

        <OptionModal open={showGifModal} title="GIF Picker" onClose={() => setShowGifModal(false)}>
          <div className="row">
            <input type="text" value={gifQuery} onChange={(e) => setGifQuery(e.target.value)} placeholder={tenorKey ? "Search GIFs (Tenor)" : "Search disabled (no Tenor key). Use URL below"} aria-label="GIF search" />
            <button className="media-btn" type="button" onClick={() => searchGifs(gifQuery)} disabled={!tenorKey || !gifQuery.trim()}>
              Search
            </button>
          </div>
          <div className="gif-grid">
            {gifResults.map((g, i) => (
              <button key={`${g.url}-${i}`} type="button" className="gif-item" onClick={() => { setGifUrl(g.url); setShowGifModal(false); }} title="Use this GIF">
                <img src={g.tiny || g.url} alt="gif" />
              </button>
            ))}
          </div>
          <div className="row">
            <input type="url" value={gifPasteUrl} onChange={(e) => setGifPasteUrl(e.target.value)} placeholder="Or paste GIF URL (https://...)" aria-label="GIF paste URL" />
            <button className="media-btn" type="button" onClick={() => { if (gifPasteUrl.trim()) { setGifUrl(gifPasteUrl.trim()); setGifPasteUrl(""); setShowGifModal(false); } }}>
              Use URL
            </button>
          </div>
        </OptionModal>

        <OptionModal open={showFilterModal} title="Filters" onClose={() => setShowFilterModal(false)}>
          <div className="slider-row"><label>Brightness</label><input type="range" min={0} max={200} value={fltBrightness} onChange={(e) => { setFltBrightness(parseInt(e.target.value)); applyFiltersAndRedraw(); }} /><span>{fltBrightness}%</span></div>
          <div className="slider-row"><label>Contrast</label><input type="range" min={0} max={200} value={fltContrast} onChange={(e) => { setFltContrast(parseInt(e.target.value)); applyFiltersAndRedraw(); }} /><span>{fltContrast}%</span></div>
          <div className="slider-row"><label>Saturation</label><input type="range" min={0} max={200} value={fltSaturation} onChange={(e) => { setFltSaturation(parseInt(e.target.value)); applyFiltersAndRedraw(); }} /><span>{fltSaturation}%</span></div>
          <div className="slider-row"><label>Sepia</label><input type="range" min={0} max={100} value={fltSepia} onChange={(e) => { setFltSepia(parseInt(e.target.value)); applyFiltersAndRedraw(); }} /><span>{fltSepia}%</span></div>
          <div className="slider-row"><label>Invert</label><input type="range" min={0} max={100} value={fltInvert} onChange={(e) => { setFltInvert(parseInt(e.target.value)); applyFiltersAndRedraw(); }} /><span>{fltInvert}%</span></div>
          <div className="slider-row"><label>Blur</label><input type="range" min={0} max={20} value={fltBlur} onChange={(e) => { setFltBlur(parseInt(e.target.value)); applyFiltersAndRedraw(); }} /><span>{fltBlur}px</span></div>
          <div className="row gap">
            <button className="media-btn" type="button" onClick={() => { if (!canvasRef.current) return; pushUndo(); updateBaseFromCanvas(); setShowFilterModal(false); }}>Apply</button>
            <button className="media-btn" type="button" onClick={() => { resetFilters(); applyFiltersAndRedraw(); }}>Reset</button>
          </div>
        </OptionModal>

        <OptionModal open={showShapeModal} title="Shapes" onClose={() => setShowShapeModal(false)}>
          <div className="row">
            <label>Color</label>
            <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
          </div>
          <div className="row">
            <label>Stroke</label>
            <input type="range" min={1} max={20} value={shapeStroke} onChange={(e) => setShapeStroke(parseInt(e.target.value))} />
            <span>{shapeStroke}px</span>
          </div>
          <div className="row gap">
            <button className="media-btn" type="button" onClick={() => { addShapeOverlay("rectangle", drawColor, shapeStroke); setShowShapeModal(false); }} disabled={!isImage}>Rectangle</button>
            <button className="media-btn" type="button" onClick={() => { addShapeOverlay("ellipse", drawColor, shapeStroke); setShowShapeModal(false); }} disabled={!isImage}>Ellipse</button>
          </div>
        </OptionModal>
      </div>

      {/* Submit FAB (bottom-right) */}
      <button
        type="submit"
        disabled={loading || (!mediaFiles.length && !gifUrl)}
        className="status-submit-btn"
        title="Share"
      >
        <span className="status-submit-text">{loading ? "Posting..." : "Share.."}</span>
      </button>
    </form>
  );

  function addShapeOverlay(shape: "rectangle" | "ellipse", color: string, stroke: number) {
    const size = 180;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = Math.round(size * 0.66);
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.strokeStyle = color;
    octx.lineWidth = stroke;
    if (shape === "rectangle") {
      octx.strokeRect(10, 10, off.width - 20, off.height - 20);
    } else {
      octx.beginPath();
      octx.ellipse(off.width / 2, off.height / 2, (off.width - 20) / 2, (off.height - 20) / 2, 0, 0, Math.PI * 2);
      octx.stroke();
    }
    const data = off.toDataURL("image/png");
    addStickerOverlay(data, Math.max(size, 128));
  }
}