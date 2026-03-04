import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],

  server: {
    port: 1420,
    proxy: {
      "/pair": {
        target: "http://192.168.1.180:8766",
        changeOrigin: true,
      },
      "/message": {
        target: "http://192.168.1.180:8766",
        changeOrigin: true,
      },
      "/clawsouls-api": {
        target: "https://clawsouls.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clawsouls-api/, "/api/v1"),
        secure: true,
      },
    },
  },
});
