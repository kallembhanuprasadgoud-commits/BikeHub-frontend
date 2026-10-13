import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        configure: (proxy) => {
          proxy.on("error", () => {});
        },
      },
      "/uploads": "http://localhost:8080",
      "/ws": {
        target: "http://localhost:8080",
        ws: true,
        configure: (proxy) => {
          proxy.on("error", () => {});
        },
      },
    },
  },
});
