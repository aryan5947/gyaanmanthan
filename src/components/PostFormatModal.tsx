import { useEffect } from "react";

type PostFormatModalProps = {
  onSelect: (format: "card" | "full") => void;
};

export default function PostFormatModal({ onSelect }: PostFormatModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - sirf close ya ignore */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          // optional: agar tum format choose mandatory rakhna chahte ho to yahan kuch mat karo
        }}
      />

      {/* Modal */}
      <div
        className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-[fadeIn_0.25s_ease]"
        onClick={(e) => e.stopPropagation()} // prevent backdrop click
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Choose Post Format
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Select how you want your post to be displayed in the feed.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect("card")}
            className="px-4 py-3 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition"
          >
            📇 Card View Post
          </button>
          <button
            onClick={() => onSelect("full")}
            className="px-4 py-3 rounded-full border border-purple-200 bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 transition"
          >
            📜 Full Detail Post
          </button>
        </div>
      </div>
    </div>
  );
}
