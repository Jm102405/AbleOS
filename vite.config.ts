import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We register the service worker ourselves in App.tsx, only on the
      // cockpit domain — the public marketing site should never install as a PWA.
      injectRegister: false,
      // "prompt" hands us control of when the new worker takes over, so an
      // update never interrupts a photo upload in progress.
      registerType: "prompt",
      includeAssets: ["icon-192.png", "icon-512.png", "push-handler.js"],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // Pulls our push and notificationclick handlers into the generated worker.
        importScripts: ["push-handler.js"],
      },
      manifest: {
        name: "Able OS",
        short_name: "Able OS",
        description: "Able OS executive cockpits",
        theme_color: "#1E3A8A",
        background_color: "#EEF2F6",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
