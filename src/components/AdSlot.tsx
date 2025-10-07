import { useEffect, useRef } from "react";
import "./AdSlot.css";

export default function AdSlot({ slot = "4506283535" }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (adRef.current && adRef.current.innerHTML.trim() === "") {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <ins
      ref={adRef as any}
      className="adsbygoogle ad-slot"
      data-ad-client="ca-pub-3756943292905076"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
