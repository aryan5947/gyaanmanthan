import React, { useState, useEffect } from "react";
import "./PostFilters.css";

interface PostFiltersProps {
  onSearch: (query: string) => void;
}

const PostFilters: React.FC<PostFiltersProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className="post-filters">
      <input
        type="text"
        placeholder="🔍 पोस्ट खोजें..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="post-filters-input"
      />
    </div>
  );
};

export default PostFilters;
