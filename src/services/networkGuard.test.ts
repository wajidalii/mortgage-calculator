import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";

/**
 * Privacy guard (PRD NFR "Privacy"): user inputs never leave the browser, so
 * no source file may use a network API. If you add a real API on purpose,
 * change this test in the same PR and update the privacy statement.
 */

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
		expect(paths).toContain("/src/lib/money.ts");
	});

	it("uses no network APIs in any source file", () => {
		const offenders = paths.flatMap((file) => {
			const text = code(file);
			return NETWORK_APIS.filter(([, pattern]) => pattern.test(text)).map(
				([name]) => `${file}: ${name}`,
			);
		});
		expect(offenders).toEqual([]);
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
