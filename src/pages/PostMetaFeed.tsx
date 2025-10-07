import React, { useState } from "react";
import { createPostMeta } from "../services/postMetaApi";
import FileUploader from "../components/FileUploader";

export default function PostMetaForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    files.forEach((file) => formData.append("files", file));

    await createPostMeta(formData);
    setTitle("");
    setDescription("");
    setFiles([]);
    alert("PostMeta created!");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <FileUploader onFilesSelected={setFiles} />
      <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
        Submit
      </button>
    </form>
  );
}
