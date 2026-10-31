import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Copies the built index.html to 404.html. Vercel and `serve` answer unknown
 * URLs with that file and a real 404 status, and the app then renders its
 * NotFound page from the same bundle.
 */
const notFoundPage = (): Plugin => ({
	name: "not-found-page",
	apply: "build",
	writeBundle(options) {
		const dir = options.dir ?? "dist";
		copyFileSync(join(dir, "index.html"), join(dir, "404.html"));
	},
});

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
	},
	plugins: [react(), tailwindcss(), notFoundPage()],
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
});
