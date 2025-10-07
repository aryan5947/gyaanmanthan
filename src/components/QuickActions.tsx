import React from 'react';

interface QuickActionsProps {
  handleCreate: () => void;
  handleExplore: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ handleCreate, handleExplore }) => {
  return (
    <div className="quick-actions flex gap-4 mt-4">
      <button
        onClick={handleCreate}
        className="px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
      >
        ✍️ Create New Post
      </button>
      <button
        onClick={handleExplore}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        🔍 Explore Feed
      </button>
    </div>
  );
};

export default QuickActions;
