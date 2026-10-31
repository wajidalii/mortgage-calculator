// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DISCLAIMER_TEXT } from "@/config/disclaimer";
import Disclaimer from "./Disclaimer";

afterEach(cleanup);

describe("Disclaimer", () => {
	it("renders the full PRD disclaimer text without any interaction", () => {
		render(<Disclaimer />);
		expect(screen.getByText(DISCLAIMER_TEXT)).toBeTruthy();
		expect(screen.getByRole("note", { name: "Disclaimer" })).toBeTruthy();
	});

	it("keeps the exact PRD wording in the shared constant", () => {
		expect(DISCLAIMER_TEXT).toBe(
			"This tool gives estimates only. It is not a loan offer, a quote, or financial advice. Tax, insurance, PMI, and ARM index values are illustrative. Your real costs can differ. Check all numbers with a lender.",
		);
	});

	it("does not hide itself in print", () => {
		const { container } = render(<Disclaimer />);
		expect(container.innerHTML).not.toMatch(/print:hidden|hidden/);
	});
});
