import React from "react";

interface SafeFollowButtonProps {
  author?: {
    _id: string;
    canFollow?: boolean;
  };
  followedAuthors: string[];
  toggleFollow: (userId: string) => void;
}

const SafeFollowButton: React.FC<SafeFollowButtonProps> = ({
  author,
  followedAuthors,
  toggleFollow,
}) => {
  if (!author?.canFollow || !author._id) return null;

  const isFollowing = followedAuthors.includes(author._id);

  return (
    <button
      className={`follow-btn ${isFollowing ? "following" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleFollow(author._id);
      }}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
};

export default SafeFollowButton;
