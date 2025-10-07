import axios from "axios";

const API = axios.create({
  baseURL: "/api/post-meta",
  withCredentials: true // agar cookies/JWT send karna ho
});

export const getPostMetaFeed = async () => {
  const res = await API.get("/feed");
  return res.data;
};

export const getUserPostMetas = async (userId: string) => {
  const res = await API.get(`/user/${userId}`);
  return res.data;
};

export const createPostMeta = async (formData: FormData) => {
  const res = await API.post("/", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const updatePostMeta = async (id: string, formData: FormData) => {
  const res = await API.put(`/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const deletePostMeta = async (id: string) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};
