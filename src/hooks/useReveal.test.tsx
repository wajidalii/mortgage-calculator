// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Reveal from "@/components/ui/Reveal";

type Callback = (entries: { isIntersecting: boolean }[]) => void;
let trigger: Callback = () => {};

class FakeObserver {
	constructor(callback: Callback) {
		trigger = callback;
	}
	observe() {}
	disconnect() {}
}

const stubViewport = (top: number, reduced: boolean) => {
	vi.stubGlobal("IntersectionObserver", FakeObserver);
	vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
		top,
	} as DOMRect);
};

beforeEach(() => {
	window.innerHeight = 800;
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const box = () => screen.getByText("content");

describe("Reveal", () => {
	it("stays visible without IntersectionObserver", () => {
		render(<Reveal>content</Reveal>);
		expect(box().className).not.toMatch(/reveal/);
	});

	it("leaves content already on screen alone", () => {
		stubViewport(100, false);
		render(<Reveal>content</Reveal>);
		expect(box().className).not.toMatch(/reveal/);
	});

	it("never hides content under reduced motion", () => {
		stubViewport(2000, true);
		render(<Reveal>content</Reveal>);
		expect(box().className).not.toMatch(/reveal/);
	});

	it("hides content below the fold, then reveals it once", () => {
		stubViewport(2000, false);
		render(<Reveal>content</Reveal>);
		expect(box().className).toContain("reveal-pending");
		act(() => trigger([{ isIntersecting: false }]));
		expect(box().className).toContain("reveal-pending");
		act(() => trigger([{ isIntersecting: true }]));
		expect(box().className).toContain("reveal-shown");
		expect(box().className).not.toContain("reveal-pending");
	});
});
