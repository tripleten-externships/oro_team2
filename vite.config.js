import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGitHubActions = globalThis.process?.env?.GITHUB_ACTIONS === "true";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: isGitHubActions ? "/oro_team2/" : "/",
  server: {
    port: 3000,
  },
});
