// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import LoanCalculator from "./LoanCalculator";

afterEach(cleanup);

const FRESH = new Date("2027-01-15T12:00:00Z");
const STALE = new Date("2027-11-01T12:00:00Z");

const panel = () => {
	const summary = screen.getByText("Assumptions and defaults");
	return within(summary.closest("details") as HTMLElement);
};
const estimate = () =>
	within(screen.getByRole("region", { name: "Estimated monthly cost" }));

describe("assumptions panel", () => {
	it("lists each default with status, as-of date and source", () => {
		render(<LoanCalculator today={FRESH} />);
		const item = panel().getByText("Homeowners insurance").closest("li");
		const row = within(item as HTMLElement);
		expect(row.getByText("$2,400.00 per year")).toBeTruthy();
		expect(row.getByText("Illustrative")).toBeTruthy();
		expect(row.getByText("As of 2026-10-30")).toBeTruthy();
		expect(row.getByText(/^Source: Four public 2026 estimates/)).toBeTruthy();
		expect(row.queryByText("May be out of date")).toBeNull();
	});

	it("shows Overridden and hides the as-of date after the user overrides a default", () => {
		render(<LoanCalculator today={FRESH} />);
		const input = screen.getByLabelText(
			/^Annual homeowners insurance/,
		) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "3000" } });
		fireEvent.blur(input);
		const row = within(
			panel().getByText("Homeowners insurance").closest("li") as HTMLElement,
		);
		expect(row.getByText("Overridden")).toBeTruthy();
		expect(row.getByText("$3,000.00 per year")).toBeTruthy();
		expect(row.queryByText(/As of/)).toBeNull();
		expect(row.queryByText(/^Source:/)).toBeNull();
	});

	it("shows 'May be out of date' in the panel and the result for old defaults", () => {
		render(<LoanCalculator today={STALE} />);
		const row = within(
			panel().getByText("Homeowners insurance").closest("li") as HTMLElement,
		);
		expect(row.getByText("May be out of date")).toBeTruthy();
		expect(estimate().getByText("May be out of date")).toBeTruthy();
		// The calculation is never blocked.
		expect(estimate().getByText(/month total/)).toBeTruthy();
	});

	it("shows no out-of-date label for fresh defaults", () => {
		render(<LoanCalculator today={FRESH} />);
		expect(screen.queryByText("May be out of date")).toBeNull();
	});

	it("keeps the disclaimer visible on the result without a click", () => {
		render(<LoanCalculator today={FRESH} />);
		expect(estimate().getByLabelText("Disclaimer")).toBeTruthy();
		fireEvent.change(screen.getByLabelText("Home price"), {
			target: { value: "x" },
		});
		expect(estimate().getByLabelText("Disclaimer")).toBeTruthy();
	});
});
