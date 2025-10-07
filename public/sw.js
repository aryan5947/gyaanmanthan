// 📌 Listen for push events
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("❌ Push event data parse error:", e);
  }

  const title = data.title || "🔔 New Notification";
  const options = {
    body: data.body || "You have a new message",
    icon: data.icon || "/icon.png", // ✅ public/icon.png से serve होगा
    badge: "/icon.png",             // optional: छोटे badge के लिए
    data: {
      url: data.url || "/",         // क्लिक करने पर redirect
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 📌 Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // अगर tab पहले से खुला है तो उसी पर focus करो
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // वरना नया tab खोलो
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
