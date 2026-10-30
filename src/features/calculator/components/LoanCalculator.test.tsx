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

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const type = (name: string, value: string) => {
	const input = field(name);
	fireEvent.change(input, { target: { value } });
	fireEvent.blur(input);
};

describe("LoanCalculator", () => {
	it("shows $400,000 and 80.00% LTV for $500,000 with 20% down", () => {
		render(<LoanCalculator />);
		expect(screen.getByText("$400,000.00")).toBeTruthy();
		expect(screen.getByText("80.00%")).toBeTruthy();
	});

	it("shows monthly principal and interest for each term", () => {
		render(<LoanCalculator />);
		expect(screen.getByText("$2,528.27")).toBeTruthy();
		fireEvent.click(screen.getByLabelText("20 years"));
		expect(screen.getByText("$2,982.29")).toBeTruthy();
		fireEvent.click(screen.getByLabelText("15 years"));
		expect(screen.getByText("$3,484.43")).toBeTruthy();
	});

	it("divides the loan by the number of payments at a 0% rate", () => {
		render(<LoanCalculator />);
		type("Interest rate", "0");
		expect(screen.getByText("$1,111.11")).toBeTruthy();
	});

	it("offers only 15, 20 and 30 year terms", () => {
		render(<LoanCalculator />);
		const radios = screen.getAllByRole("radio") as HTMLInputElement[];
		expect(radios.map((radio) => radio.value)).toEqual(["15", "20", "30"]);
		expect(radios.find((radio) => radio.checked)?.value).toBe("30");
		fireEvent.click(screen.getByLabelText("15 years"));
		expect(
			(screen.getByLabelText("15 years") as HTMLInputElement).checked,
		).toBe(true);
	});

	it("updates the dollar amount from the percent when leaving the field", () => {
		render(<LoanCalculator />);
		const percent = field("Down payment (%)");
		fireEvent.change(percent, { target: { value: "25" } });
		expect(field("Down payment ($)").value).toBe("100,000.00");
		fireEvent.blur(percent);
		expect(field("Down payment ($)").value).toBe("125,000.00");
		expect(screen.getByText("$375,000.00")).toBeTruthy();
	});

	it("updates the percent after switching to dollar entry", () => {
		render(<LoanCalculator />);
		fireEvent.click(screen.getByRole("button", { name: "Dollar amount" }));
		expect(field("Down payment (%)").readOnly).toBe(true);
		type("Down payment ($)", "150000");
		expect(field("Down payment (%)").value).toBe("30.00");
		expect(screen.getByText("$350,000.00")).toBeTruthy();
	});

	it("shows $0 and 0.00% LTV at 100% down", () => {
		render(<LoanCalculator />);
		type("Down payment (%)", "100");
		// Loan amount and monthly principal and interest are both $0.00.
		expect(screen.getAllByText("$0.00")).toHaveLength(2);
		expect(screen.getByText("0.00%")).toBeTruthy();
	});

	it("shows an accessible error after leaving an invalid field", () => {
		render(<LoanCalculator />);
		fireEvent.click(screen.getByRole("button", { name: "Dollar amount" }));
		const amount = field("Down payment ($)");
		fireEvent.change(amount, { target: { value: "600000" } });
		expect(amount.getAttribute("aria-invalid")).toBeNull();
		fireEvent.blur(amount);
		const message = screen.getByText(
			"Down payment cannot be more than the price",
		);
		expect(amount.getAttribute("aria-invalid")).toBe("true");
		expect(amount.getAttribute("aria-describedby")).toContain(message.id);
		expect(screen.queryByText("$400,000.00")).toBeNull();
	});

	it("shows an error for an empty price and recovers when fixed", () => {
		render(<LoanCalculator />);
		type("Home price", "");
		expect(screen.getByText("Enter a home price")).toBeTruthy();
		type("Home price", "300000");
		expect(screen.queryByText("Enter a home price")).toBeNull();
		expect(screen.getByText("$240,000.00")).toBeTruthy();
	});

	it("validates the interest rate text", () => {
		render(<LoanCalculator />);
		type("Interest rate", "abc");
		expect(screen.getByText("An interest rate must be a number")).toBeTruthy();
	});

	describe("amortization schedule", () => {
		it("shows lifetime interest and a $0 final balance for the golden loan", () => {
			render(<LoanCalculator />);
			// Default inputs are $400,000 at 6.50% over 30 years.
			expect(screen.getByText("$510,179.81")).toBeTruthy();
			fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
			const table = screen.getByRole("table");
			const rows = within(table).getAllByRole("row");
			expect(rows).toHaveLength(361); // header + 360 months
			const last = within(rows[360] as HTMLElement).getAllByRole("cell");
			expect(last.at(-1)?.textContent).toBe("$0.00");
		});

		it("switches to yearly rows that sum their months", () => {
			render(<LoanCalculator />);
			fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
			const monthly = within(screen.getByRole("table")).getAllByRole("row");
			const cents = (row: HTMLElement, column: number) =>
				Number(
					(within(row).getAllByRole("cell")[column]?.textContent ?? "").replace(
						/[$,.]/g,
						"",
					),
				);
			const firstYearInterest = monthly
				.slice(1, 13)
				.reduce((sum, row) => sum + cents(row, 2), 0);

			fireEvent.click(screen.getByRole("button", { name: "Yearly" }));
			const yearly = within(screen.getByRole("table")).getAllByRole("row");
			expect(yearly).toHaveLength(31); // header + 30 years
			expect(cents(yearly[1] as HTMLElement, 2)).toBe(firstYearInterest);
		});

		it("explains there is no schedule for a $0 loan", () => {
			render(<LoanCalculator />);
			type("Down payment (%)", "100");
			expect(screen.queryByRole("table")).toBeNull();
			expect(screen.getByText(/no schedule/i)).toBeTruthy();
		});
	});
});
