import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom"],
  },
  // Pre-bundle chart/UI deps so Vite never re-optimizes mid-session (which loads two React copies).
  optimizeDeps: {
    include: ["recharts", "@radix-ui/react-dialog", "@radix-ui/react-tooltip", "@radix-ui/react-select", "lucide-react"],
  },
});
