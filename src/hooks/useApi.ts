import { useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";

export function useApi<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    apiFetch<T>(url).then((res) => {
      if (!mounted) return;
      setData(res.data);
      setError(res.error);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [url]);

  return { data, error, loading };
}
