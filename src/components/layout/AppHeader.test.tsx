// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import AppHeader from "./AppHeader";

afterEach(cleanup);

const current = (name: string) =>
	screen.getByRole("link", { name }).getAttribute("aria-current");

describe("AppHeader", () => {
	it("links to each calculator and marks the current page", () => {
		render(
			<MemoryRouter initialEntries={["/compare"]}>
				<AppHeader />
			</MemoryRouter>,
		);
		const nav = screen.getByRole("navigation", { name: "Main" });
		expect(nav.querySelectorAll("a")).toHaveLength(3);
		expect(current("Compare loans")).toBe("page");
		expect(current("Calculator")).toBeNull();
	});
});
