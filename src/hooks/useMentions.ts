import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Mention {
  _id: string;
  postId: string;
  fromUser: { _id: string; username: string };
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export function useMentions(userId: string) {
  const queryClient = useQueryClient();

  // ✅ Fetch accepted mentions for a user
  const {
    data: mentions,
    isLoading,
    isError,
  } = useQuery<Mention[]>({
    queryKey: ["mentions", userId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/mentions/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!userId,
  });

  // ✅ Accept a mention
  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/mentions/${id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentions", userId] });
    },
  });

  // ✅ Reject a mention
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/mentions/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentions", userId] });
    },
  });

  return {
    mentions,
    isLoading,
    isError,
    acceptMention: acceptMutation.mutate,
    rejectMention: rejectMutation.mutate,
  };
}
