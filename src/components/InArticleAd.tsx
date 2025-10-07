// src/components/InArticleAd.tsx
import { useEffect } from "react";

export default function InArticleAd() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center" }}
      data-ad-client="ca-pub-3756943292905076"
      data-ad-slot="9846240121"
      data-ad-format="fluid"
      data-ad-layout="in-article"
    />
  );
}
