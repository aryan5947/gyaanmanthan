import React, { useState } from 'react';
import Header from '../components/Header';
import PostFilters from '../components/PostFilters';

const ExploreFeed: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // You can trigger a fetch or filter logic here
  };

  return (
    <section className="p-6">
      <Header
        title="Explore Feed"
        subtitle="Find posts by category or keyword"
      />

      <PostFilters

        onSearch={handleSearch}
      />
    </section>
  );
};

export default ExploreFeed;
