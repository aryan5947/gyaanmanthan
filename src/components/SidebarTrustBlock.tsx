import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import "./SidebarTrustBlock.css";

export default function SidebarTrustBlock() {
  const [showQR, setShowQR] = useState(false);

  const modalContent = (
    <div className="qr-modal">
      <div className="qr-modal__content">
        <span className="qr-modal__close" onClick={() => setShowQR(false)}>
          &times;
        </span>
        <h3>MSME Udyam Certificate</h3>
        <p>Enterprise: GyaanManthan</p>
        <p>Udyam No: UDYAM‑UP‑43‑0159324</p>
        <img src="/udyam-qr.png" alt="Udyam QR Code" className="qr-modal__image" />
        <a href="https://udyamregistration.gov.in" target="_blank" rel="noreferrer">
          Verify on MSME Portal
        </a>
      </div>
    </div>
  );

  return (
    <div className="trust-block">
      <h4 className="trust-block__title">Trust & Legal</h4>
      <ul className="trust-block__links">
        <li><Link to="/about">About Us</Link></li>
        <li><Link to="/privacy">Privacy Policy</Link></li>
        <li><Link to="/disclaimer">Disclaimer</Link></li>
      </ul>

      <div className="trust-block__badge">
        <p className="trust-block__msme">Registered MSME</p>
        <p className="trust-block__id">UDYAM‑UP‑43‑0159324</p>
        <button onClick={() => setShowQR(true)} className="trust-block__qr-btn">
          View QR
        </button>
      </div>

      {showQR && createPortal(modalContent, document.body)}
    </div>
  );
}
