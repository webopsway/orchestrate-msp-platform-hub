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
    outDir: "dist-msp-admin",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/apps/msp-admin/main.tsx"),
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  define: {
    "process.env.VITE_APP_TYPE": JSON.stringify("msp-admin"),
  },
}); 