// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { DISCLAIMER_TEXT } from "@/config/disclaimer";
import HomePage from "./HomePage";

afterEach(cleanup);

const renderHome = () =>
	render(
		<MemoryRouter>
			<HomePage />
		</MemoryRouter>,
	);

describe("HomePage", () => {
	it("has exactly one h1 and ordered section headings", () => {
		renderHome();
		expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
		const sections = screen
			.getAllByRole("heading", { level: 2 })
			.map((heading) => heading.textContent);
		expect(sections).toHaveLength(6);
		expect(sections[0]).toMatch(/plan the purchase/i);
	});

	it("sends the hero calls to action to the real routes", () => {
		renderHome();
		const hero = screen.getByRole("region", {
			name: /what a home will really cost/i,
		});
		expect(
			within(hero)
				.getByRole("link", { name: /calculate my mortgage/i })
				.getAttribute("href"),
		).toBe("/calculator");
		expect(
			within(hero)
				.getByRole("link", { name: /compare loan options/i })
				.getAttribute("href"),
		).toBe("/compare");
	});

	it("links every tool to an existing route", () => {
		renderHome();
		const hrefs = screen
			.getAllByRole("link")
			.map((link) => link.getAttribute("href"));
		for (const route of ["/calculator", "/compare", "/refinance"]) {
			expect(hrefs).toContain(route);
		}
		expect(hrefs.filter((href) => href && !href.startsWith("/"))).toEqual([]);
	});

	it("labels the preview as an example", () => {
		renderHome();
		expect(screen.getByText("Example")).toBeTruthy();
		expect(screen.getByText(/sample numbers/i)).toBeTruthy();
	});

	it("shows the shared disclaimer and explains local-only storage", () => {
		renderHome();
		expect(screen.getByText(DISCLAIMER_TEXT)).toBeTruthy();
		expect(
			screen.getByText(/local storage, on this device only/i),
		).toBeTruthy();
		expect(screen.getByText(/never sent to a server/i)).toBeTruthy();
	});
});
