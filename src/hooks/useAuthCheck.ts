import { useEffect } from "react";
import API from "../services/api";
import { loginModalStore } from "../store/loginModalStore";

export function useAuthCheck() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If you use cookies for auth: add { withCredentials: true }
        const resp = await API.get("/user/me");
        // New backend behavior: 200 + { authenticated:false } when not logged in
        if (resp?.data && resp.data.authenticated === false) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          loginModalStore.getState().openModal();
          return;
        }
        // If your controller returns the full profile, you can optionally store it here.
        // Example:
        // if (resp?.data?.me) localStorage.setItem("user", JSON.stringify(resp.data.me));
      } catch (err: any) {
        // Fallback for any unexpected non-200s
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          loginModalStore.getState().openModal();
        }
      }
    };

    checkAuth();
  }, []);
}