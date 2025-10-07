import { useEffect } from "react";
import API from "../services/api";
import { loginModalStore } from "../store/loginModalStore";

export function useAuthCheck() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get("/user/me"); // 👈 backend auth check
      } catch (err: any) {
        if (err.response?.status === 401) {
          // token invalid → cleanup + open modal
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          loginModalStore.getState().openModal();
        }
      }
    };

    checkAuth();
  }, []);
}
