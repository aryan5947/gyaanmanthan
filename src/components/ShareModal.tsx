import React from "react";
import {
  XMarkIcon,
  ClipboardIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import {
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaTelegram,
  FaReddit,
  FaEnvelope,
} from "react-icons/fa";
import "./ShareModel.css";

interface ShareModalProps {
  url: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

const platforms = [
  {
    name: "WhatsApp",
    url: (shareUrl: string, title?: string) =>
      `https://wa.me/?text=${encodeURIComponent(
        title ? `${title}\n${shareUrl}` : shareUrl
      )}`,
    icon: <FaWhatsapp className="share-icon" />,
  },
  {
    name: "Facebook",
    url: (shareUrl: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
    icon: <FaFacebook className="share-icon" />,
  },
  {
    name: "X (Twitter)",
    url: (shareUrl: string, title?: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}${title ? `&text=${encodeURIComponent(title)}` : ""}`,
    icon: <FaTwitter className="share-icon" />,
  },
  {
    name: "LinkedIn",
    url: (shareUrl: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl
      )}`,
    icon: <FaLinkedin className="share-icon" />,
  },
  {
    name: "Telegram",
    url: (shareUrl: string, title?: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl
      )}${title ? `&text=${encodeURIComponent(title)}` : ""}`,
    icon: <FaTelegram className="share-icon" />,
  },
  {
    name: "Reddit",
    url: (shareUrl: string, title?: string) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(
        shareUrl
      )}${title ? `&title=${encodeURIComponent(title)}` : ""}`,
    icon: <FaReddit className="share-icon" />,
  },
  {
    name: "Email",
    url: (shareUrl: string, title?: string) =>
      `mailto:?subject=${encodeURIComponent(
        title || "Check this out"
      )}&body=${encodeURIComponent(shareUrl)}`,
    icon: <FaEnvelope className="share-icon" />,
  },
];

const ShareModal: React.FC<ShareModalProps> = ({
  url,
  title,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy link.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <XMarkIcon className="icon" />
        </button>
        <h3 className="modal-title">Share Post</h3>
        <div className="share-buttons-grid">
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.url(url, title)}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn"
              title={`Share on ${p.name}`}
            >
              {p.icon}
              <span>{p.name}</span>
            </a>
          ))}
          <button className="share-btn" onClick={handleCopy} title="Copy Link">
            <ClipboardIcon className="share-icon" />
            <span>Copy Link</span>
          </button>
        </div>
        <div className="share-url-preview">
          <ShareIcon className="icon" /> <span>{url}</span>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
