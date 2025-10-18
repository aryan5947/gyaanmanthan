import React, { useState } from "react";
import StatusTextCreate from "./StatusTextCreate";
import StatusMediaCreate from "./StatusMediaCreate";

export default function StatusCreatePage() {
  const [activeTab, setActiveTab] = useState<"text" | "media">("text");

  return (
    <div className="status-modal-backdrop" style={{ position: "static", minHeight: "100vh", background: "#1a1a1a" }}>
      <div className="status-modal" style={{ boxShadow: "none", margin: "2rem auto", maxWidth: "440px" }}>
        <h2>Create Status</h2>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button onClick={() => setActiveTab("text")} disabled={activeTab === "text"}>Text</button>
          <button onClick={() => setActiveTab("media")} disabled={activeTab === "media"}>Photo/Video</button>
        </div>
        {activeTab === "text" ? <StatusTextCreate /> : <StatusMediaCreate />}
        <div className="status-modal-tip">
          <b>Tip:</b> Select images or videos from your device, or use your camera directly for instant capture!
        </div>
      </div>
    </div>
  );
}