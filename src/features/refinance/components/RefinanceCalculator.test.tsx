// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import RefinanceCalculator from "./RefinanceCalculator";

afterEach(cleanup);

const type = (name: string, value: string) => {
	const input = screen.getByLabelText(name);
	fireEvent.change(input, { target: { value } });
	fireEvent.blur(input);
};

const fill = (newRate: string) => {
	type("Current loan balance", "300000");
	type("Remaining months", "300");
	type("Current interest rate", "7.5");
	type("New interest rate", newRate);
	type("Refinance costs (optional)", "6000");
};

describe("RefinanceCalculator", () => {
	it("shows the saving, break-even and the same-term statement", () => {
		render(<RefinanceCalculator />);
		fill("6.5");
		expect(screen.getByText("$191.35")).toBeTruthy();
		expect(screen.getByText("32")).toBeTruthy();
		expect(screen.getByText(/same term as the remaining term/)).toBeTruthy();
	});

	it("shows No monthly saving and no break-even for a higher rate", () => {
		render(<RefinanceCalculator />);
		fill("8");
		expect(screen.getByText(/No monthly saving/)).toBeTruthy();
		expect(screen.queryByText(/months to break even/)).toBeNull();
		expect(screen.getByText(/same term as the remaining term/)).toBeTruthy();
	});

	it("shows an error for a bad month count after leaving the field", () => {
		render(<RefinanceCalculator />);
		type("Remaining months", "0");
		expect(
			screen.getByText("Months must be a whole number from 1 to 480"),
		).toBeTruthy();
	});
});
