import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import EditPost from "../components/EditPost";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data.data || data); // Adjust as per your API response
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;

  return <EditPost post={post} postFormat="full" />;
}