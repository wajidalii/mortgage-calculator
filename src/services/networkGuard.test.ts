import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";

/**
 * Privacy guard (PRD NFR "Privacy"): user inputs never leave the browser.
 * `src/services/api/client.ts` is the only file allowed to touch the network,
 * and no calculator, page, hook or library code may import it. If you add a
 * real API on purpose, change this test in the same PR and update the privacy
 * statement.
 */

const ALLOWED_NETWORK_FILE = "/src/services/api/client.ts";

/** Every non-test source file, by absolute path from the project root. */
const sources = import.meta.glob(
	["/src/**/*.{ts,tsx}", "!/src/**/*.test.{ts,tsx}"],
	{ query: "?raw", import: "default", eager: true },
) as Record<string, string>;
const paths = Object.keys(sources);

/** The file with comments removed, so prose about "fetch" does not trip the scan. */
const code = (path: string): string =>
	(sources[path] ?? "")
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/(^|[^:])\/\/.*$/gm, "$1");

const NETWORK_APIS: readonly [string, RegExp][] = [
	["fetch()", /\bfetch\s*\(/],
	["XMLHttpRequest", /\bXMLHttpRequest\b/],
	["sendBeacon", /\bsendBeacon\b/],
	["WebSocket", /\bWebSocket\b/],
	["EventSource", /\bEventSource\b/],
	["new Image()", /\bnew\s+Image\s*\(/],
	["importScripts", /\bimportScripts\b/],
	["navigator.serviceWorker", /\bserviceWorker\b/],
];

describe("network guard", () => {
	it("finds the source files it is meant to scan", () => {
		expect(paths.length).toBeGreaterThan(50);
		expect(paths).toContain(ALLOWED_NETWORK_FILE);
	});

	it("uses network APIs only in services/api/client.ts", () => {
		const offenders = paths
			.filter((file) => file !== ALLOWED_NETWORK_FILE)
			.flatMap((file) => {
				const text = code(file);
				return NETWORK_APIS.filter(([, pattern]) => pattern.test(text)).map(
					([name]) => `${file}: ${name}`,
				);
			});
		expect(offenders).toEqual([]);
	});

	it("keeps the API client's only network call inside apiRequest", () => {
		expect(code(ALLOWED_NETWORK_FILE).match(/\bfetch\s*\(/g)).toHaveLength(1);
	});

	it("does not import the API client from calculator code", () => {
		const importers = paths
			.filter((file) => !file.startsWith("/src/services/"))
			.filter((file) => /from\s+["'][^"']*services\/api/.test(code(file)));
		expect(importers).toEqual([]);
	});

	it("loads nothing from other origins in index.html", () => {
		const external = [
			...indexHtml.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g),
		]
			.map((match) => match[1] ?? "")
			.filter((url) => /^(https?:)?\/\//.test(url));
		expect(external).toEqual([]);
	});

	it("guards itself: the scan would catch a fetch call", () => {
		const sample = 'const x = await fetch("/leak", { body: inputs });';
		expect(NETWORK_APIS.some(([, pattern]) => pattern.test(sample))).toBe(true);
	});
});
