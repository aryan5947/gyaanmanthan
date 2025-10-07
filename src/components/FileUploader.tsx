import React, { useRef } from "react";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export default function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      className="border-2 border-dashed p-4 rounded-lg text-center cursor-pointer hover:bg-gray-50"
      onClick={() => fileInputRef.current?.click()}
    >
      <p className="text-gray-500">Click or drag files here (max 10)</p>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        hidden
        onChange={handleFiles}
      />
    </div>
  );
}
