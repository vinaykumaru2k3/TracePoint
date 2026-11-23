import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `vite preview` serves the production headers from vercel.json. The dev server
// stays without them, because Vite dev injects inline scripts.
const vercel = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8"));
const headers = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]));

export default defineConfig({
  plugins: [react()],
  preview: { headers },
  test: { setupFiles: ["src/test/setup.ts"] },
});
