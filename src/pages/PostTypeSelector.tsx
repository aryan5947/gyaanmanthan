import React from "react";
import { useNavigate } from "react-router-dom";
import "./PostTypeSelector.css";

interface PostTypeSelectorModalProps {
  onClose: () => void;
}

export default function PostTypeSelectorModal({ onClose }: PostTypeSelectorModalProps) {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    navigate(path);
    onClose(); // modal close after navigation
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close" onClick={onClose}>✖</button>
        <h2 className="modal-title">Choose Post Format</h2>
        <div className="modal-options">
          <div className="option-card" onClick={() => handleSelect("/post-meta/create")}>
            <h3>📝 Card View Post</h3>
            <p>You can write anything here — a thought, a question, a joke, a poem, or even just an emoji 😄.</p>
          </div>

          <div className="option-card" onClick={() => handleSelect("/create")}>
            <h3>📄 Full Detail Post</h3>
            <p>Write a complete article with full details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
