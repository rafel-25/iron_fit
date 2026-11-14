import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(projectRoot, "index.html"),
        login: resolve(projectRoot, "login.html"),
        register: resolve(projectRoot, "register.html"),
        program: resolve(projectRoot, "program.html"),
        admin: resolve(projectRoot, "admin/dashboard.html"),
        user: resolve(projectRoot, "user/dashboard.html")
      }
    }
  }
});