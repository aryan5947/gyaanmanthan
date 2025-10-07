import "./PostMeta.css";

export default function PostResultModal({
  onClose,
  success,
  message
}: {
  onClose: () => void;
  success: boolean;
  message: string;
}) {
  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}>✖</button>
        </div>
        <div className="modal-body" style={{ justifyContent: "center", alignItems: "center" }}>
          {success ? (
            <span className="success-chip">✅ {message}</span>
          ) : (
            <span className="error-chip">⚠️ {message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
