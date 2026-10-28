import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.CREDITO_PORT || "18765"}`,
        configure(proxy) {
          proxy.on("proxyReq", (req) => {
            req.removeHeader("origin");
            req.setHeader("X-Credito-Token", process.env.CREDITO_TOKEN || "");
          });
        },
      },
    },
  },
});
