import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  
  plugins: [tailwindcss()],

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      "/pair": {
        target: "http://192.168.1.180:8766",
        changeOrigin: true,
      },
      "/message": {
        target: "http://192.168.1.180:8766",
        changeOrigin: true,
      },
    },
  },
});
