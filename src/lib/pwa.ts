// Keeps the installed home-screen app up to date.
//
// The problem this solves: a PWA that's never fully quit will happily run an
// old build forever, because the service worker only checks for updates when
// the page loads. So we poll, and apply the update the next time the app is
// brought to the foreground - never mid-upload.

import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_MS = 60 * 60 * 1000; // hourly

export function setupPwaUpdates() {
  const updateSW = registerSW({
    immediate: true,

    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      // Ask the server for a newer build on a timer, and whenever the app
      // comes back to the foreground.
      setInterval(() => registration.update(), UPDATE_CHECK_MS);

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) registration.update();
      });
    },

    onNeedRefresh() {
      // A new build is downloaded and waiting. Apply it while the app is in
      // the background, or the moment it next becomes visible.
      if (document.hidden) {
        updateSW(true);
        return;
      }

      function applyWhenVisible() {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", applyWhenVisible);
        updateSW(true);
      }

      document.addEventListener("visibilitychange", applyWhenVisible);
    },

    onRegisterError(error) {
      console.error("Service worker registration failed:", error);
    },
  });
}
