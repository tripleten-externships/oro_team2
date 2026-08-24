import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGitHubActions = globalThis.process?.env?.GITHUB_ACTIONS === "true";
const publicBase = globalThis.process?.env?.VITE_PUBLIC_BASE;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages remains under the repository path. The isolated
  // CloudFront/Amplify publication explicitly sets VITE_PUBLIC_BASE=/ so its
  // public assets are requested from the canonical site root instead.
  base: publicBase ?? (isGitHubActions ? "/oro_team2/" : "/"),
  server: {
    port: 3000,
  },
});
