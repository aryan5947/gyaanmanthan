import { useState, useCallback } from "react";

// Helper: Convert VAPID public key (base64) → Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(vapidPublicKey: string) {
  const [isSupported, setIsSupported] = useState<boolean>(
    "serviceWorker" in navigator && "PushManager" in window
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // ✅ Register Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  }, [isSupported]);

  // ✅ Subscribe user
  const subscribe = useCallback(async () => {
    try {
      const reg = await registerServiceWorker();
      if (!reg) throw new Error("Service Worker not registered");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(sub);

      // Send subscription to backend
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sub),
      });

      console.log("✅ Subscribed:", sub);
      return sub;
    } catch (err) {
      console.error("❌ Subscription failed:", err);
      return null;
    }
  }, [registerServiceWorker, vapidPublicKey]);

  // ✅ Unsubscribe user
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    await subscription.unsubscribe();
    setSubscription(null);
    console.log("🚫 Unsubscribed");
    // Optionally: call backend to remove subscription
  }, [subscription]);

  return {
    isSupported,
    subscription,
    subscribe,
    unsubscribe,
  };
}
