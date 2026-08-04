/* global self */
// Imported into the generated service worker via workbox importScripts.
// Runs even when the PWA is closed - this is what puts a notification on the
// lock screen.

self.addEventListener("push", (event) => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch {
        // Non-JSON payload, fall back to raw text.
        data = { title: "Able OS", body: event.data ? event.data.text() : "" };
    }

    const title = data.title || "Able OS";

    const options = {
        body: data.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        // A tag means a newer notification of the same kind replaces the old one
        // instead of stacking up.
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: { url: data.url || "/" },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const target = (event.notification.data && event.notification.data.url) || "/";

    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });

            // Already open on that page - just focus it.
            for (const client of windows) {
                if (client.url.includes(target) && "focus" in client) {
                    return client.focus();
                }
            }

            // Open somewhere else - focus and navigate.
            if (windows.length && "navigate" in windows[0]) {
                await windows[0].focus();
                return windows[0].navigate(target);
            }

            return self.clients.openWindow(target);
        })(),
    );
});