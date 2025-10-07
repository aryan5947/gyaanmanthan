import React from "react";

interface PostMetaCardProps {
  data: any;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function PostMetaCard({ data, onDelete, onEdit }: PostMetaCardProps) {
  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white">
      {data.images?.length > 0 && (
        <img
          src={data.images[0]}
          alt={data.title}
          className="w-full h-48 object-cover rounded"
        />
      )}
      <h3 className="text-lg font-semibold mt-2">{data.title}</h3>
      <p className="text-gray-600">{data.description}</p>
      <div className="flex gap-2 mt-3">
        {onEdit && <button onClick={onEdit} className="px-3 py-1 bg-blue-500 text-white rounded">Edit</button>}
        {onDelete && <button onClick={onDelete} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>}
      </div>
    </div>
  );
}
