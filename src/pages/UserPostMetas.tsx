import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserPostMetas, deletePostMeta } from "../services/postMetaApi";
import PostMetaCard from "../components/PostMetaCard";

export default function UserPostMetas() {
  const { id } = useParams<{ id: string }>(); // URL param se userId le rahe hain
  const [posts, setPosts] = useState<any[]>([]);

  const loadPosts = async () => {
    if (!id) return; // agar id missing hai to skip
    const data = await getUserPostMetas(id);
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, [id]);

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {posts.length > 0 ? (
        posts.map((item) => (
          <PostMetaCard
            key={item._id}
            data={item}
            onDelete={() => {
              deletePostMeta(item._id).then(loadPosts);
            }}
          />
        ))
      ) : (
        <p className="col-span-3 text-center text-gray-500">
          No PostMeta found for this user.
        </p>
      )}
    </div>
  );
}
