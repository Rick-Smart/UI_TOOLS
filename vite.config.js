import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);
const petSystemEnabled = packageJson?.featureFlags?.petSystemEnabled !== false;

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_PET_SYSTEM_ENABLED": JSON.stringify(petSystemEnabled),
  },
});
