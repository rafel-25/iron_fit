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
        training: resolve(projectRoot, "training.html"),
        bmi: resolve(projectRoot, "bmi.html"),
        calories: resolve(projectRoot, "calories.html"),
        dashboard: resolve(projectRoot, "dashboard.html"),
        profile: resolve(projectRoot, "profile.html"),
        nutrition: resolve(projectRoot, "nutrition.html"),
        login: resolve(projectRoot, "login.html"),
        register: resolve(projectRoot, "register.html"),
        program: resolve(projectRoot, "program.html"),
        exercises: resolve(projectRoot, "exercises.html"),
        meals: resolve(projectRoot, "meals.html"),
        admin: resolve(projectRoot, "admin/dashboard.html"),
        user: resolve(projectRoot, "user/dashboard.html")
      }
    }
  }
});