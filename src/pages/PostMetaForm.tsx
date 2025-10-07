// src/pages/PostMetaForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePostModal from "../components/CreatePostModal";

export default function PostMetaForm() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    navigate("/");
  };

  return (
    <>
      {showModal && <CreatePostModal onClose={handleClose} />}
    </>
  );
}
