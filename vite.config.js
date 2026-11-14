import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(projectRoot, "index.html"),
        login: resolve(projectRoot, "login.html"),
        register: resolve(projectRoot, "register.html"),
        admin: resolve(projectRoot, "admin/dashboard.html"),
        user: resolve(projectRoot, "user/dashboard.html")
      }
    }
  }
});