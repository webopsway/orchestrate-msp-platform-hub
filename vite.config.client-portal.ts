import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-client-portal",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/apps/client-portal/main.tsx"),
      },
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  define: {
    "process.env.VITE_APP_TYPE": JSON.stringify("client-portal"),
  },
}); 