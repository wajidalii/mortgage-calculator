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
/** The standalone P&I result, not the line in the itemized estimate. */
const piSummary = () =>
	within(
		screen.getByRole("region", { name: "Monthly principal and interest" }),
	);
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
		expect(piSummary().getByText("$2,528.27")).toBeTruthy();
		fireEvent.click(screen.getByLabelText("20 years"));
		expect(piSummary().getByText("$2,982.29")).toBeTruthy();
		fireEvent.click(screen.getByLabelText("15 years"));
		expect(piSummary().getByText("$3,484.43")).toBeTruthy();
	});

	it("divides the loan by the number of payments at a 0% rate", () => {
		render(<LoanCalculator />);
		type("Interest rate", "0");
		expect(piSummary().getByText("$1,111.11")).toBeTruthy();
	});

	it("offers only 15, 20 and 30 year terms", () => {
		render(<LoanCalculator />);
		const radios = within(
			screen.getByRole("group", { name: "Loan term" }),
		).getAllByRole("radio") as HTMLInputElement[];
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
		const summary = screen.getByRole("region", {
			name: "Monthly principal and interest",
		});
		expect(within(summary).getAllByText("$0.00")).toHaveLength(2);
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
	describe("property tax (S-3)", () => {
		it("shows the NJ estimate with the illustrative label by default", () => {
			render(<LoanCalculator />);
			const section = screen.getByRole("region", {
				name: "Estimated property tax",
			});
			expect(within(section).getByText("$10,000.00")).toBeTruthy();
			expect(within(section).getByText("$833.33")).toBeTruthy();
			expect(within(section).getByText("Illustrative estimate")).toBeTruthy();
			expect(within(section).queryByText("Manual override")).toBeNull();
		});

		it("shows the TX estimate for $500,000", () => {
			render(<LoanCalculator />);
			fireEvent.change(screen.getByLabelText("State"), {
				target: { value: "TX" },
			});
			const section = screen.getByRole("region", {
				name: "Estimated property tax",
			});
			expect(within(section).getByText("$8,000.00")).toBeTruthy();
			expect(within(section).getByText("$666.67")).toBeTruthy();
			expect(within(section).getByText("Month 12")).toBeTruthy();
			expect(within(section).getByText("$666.63")).toBeTruthy();
		});

		it("uses a manual override, labels it, and returns to the state rate when cleared", () => {
			render(<LoanCalculator />);
			const section = () =>
				screen.getByRole("region", { name: "Estimated property tax" });
			type("Annual property tax (optional)", "6000");
			expect(within(section()).getByText("$6,000.00")).toBeTruthy();
			expect(within(section()).getByText("$500.00")).toBeTruthy();
			expect(within(section()).getByText("Manual override")).toBeTruthy();
			expect(within(section()).queryByText("Illustrative estimate")).toBeNull();

			type("Annual property tax (optional)", "");
			expect(within(section()).getByText("$10,000.00")).toBeTruthy();
			expect(within(section()).getByText("Illustrative estimate")).toBeTruthy();
			expect(within(section()).queryByText("Manual override")).toBeNull();
		});

		it("shows an error for a bad override after leaving the field", () => {
			render(<LoanCalculator />);
			type("Annual property tax (optional)", "abc");
			expect(
				screen.getByText("Annual property tax must be a number"),
			).toBeTruthy();
		});
	});

	describe("insurance, HOA and other costs (S-4)", () => {
		const section = () =>
			screen.getByRole("region", {
				name: "Insurance, HOA and other monthly costs",
			});

		it("uses the $2,400 default and labels it when insurance is empty", () => {
			render(<LoanCalculator />);
			expect(within(section()).getByText("$200.00")).toBeTruthy();
			expect(
				within(section()).getByText("Illustrative estimate, not a quote."),
			).toBeTruthy();
		});

		it("shows $150.00 for $1,800 insurance and $100.00 HOA under non-escrow", () => {
			render(<LoanCalculator />);
			type("Annual homeowners insurance", "1800");
			type("Monthly HOA", "100");
			expect(within(section()).getByText("$150.00")).toBeTruthy();
			expect(
				within(section()).queryByText("Illustrative estimate, not a quote."),
			).toBeNull();
			const nonEscrow = within(section())
				.getByRole("heading", { name: "Non-escrow" })
				.closest("div") as HTMLElement;
			expect(within(nonEscrow).getByText("$100.00")).toBeTruthy();
		});

		it("rejects a negative value with an error and does not use it", () => {
			render(<LoanCalculator />);
			type("Monthly HOA", "-100");
			expect(screen.getByText("Monthly HOA cannot be negative")).toBeTruthy();
			expect(field("Monthly HOA").getAttribute("aria-invalid")).toBe("true");
			expect(within(section()).queryByText("-$100.00")).toBeNull();
			expect(
				within(section()).getByText(
					"Fix the highlighted fields to see these costs.",
				),
			).toBeTruthy();
			type("Monthly HOA", "100");
			expect(within(section()).getByText("$100.00")).toBeTruthy();
		});
	});

	describe("PMI (S-5)", () => {
		const section = () =>
			screen.getByRole("region", { name: "Private mortgage insurance (PMI)" });

		it("is off at 20% down and hides the PMI controls", () => {
			render(<LoanCalculator />);
			expect(
				within(section()).getByText(
					"PMI is off: the loan is 80% of the home price or less.",
				),
			).toBeTruthy();
			expect(screen.queryByLabelText(/Include PMI/)).toBeNull();
		});

		it("is on at 10% down with LTV 90.00%, removal month 95 and end month 109", () => {
			render(<LoanCalculator />);
			type("Down payment (%)", "10");
			expect(screen.getByText("90.00%")).toBeTruthy();
			expect(within(section()).getByText("$281.25")).toBeTruthy();
			expect(within(section()).getByText("Month 95")).toBeTruthy();
			expect(within(section()).getByText("Month 109")).toBeTruthy();
			expect(within(section()).getByText("Illustrative estimate")).toBeTruthy();
		});

		it("uses an entered PMI rate: $450,000 at 0.50% is $187.50", () => {
			render(<LoanCalculator />);
			type("Down payment (%)", "10");
			type("PMI rate (per year)", "0.50");
			expect(within(section()).getByText("$187.50")).toBeTruthy();
			expect(within(section()).queryByText("Illustrative estimate")).toBeNull();
		});

		it("can be turned off and back on", () => {
			render(<LoanCalculator />);
			type("Down payment (%)", "10");
			fireEvent.click(screen.getByLabelText(/Include PMI/));
			expect(within(section()).getByText("PMI is turned off.")).toBeTruthy();
			fireEvent.click(screen.getByLabelText(/Include PMI/));
			expect(within(section()).getByText("$281.25")).toBeTruthy();
		});

		it("shows an error for a bad PMI rate", () => {
			render(<LoanCalculator />);
			type("Down payment (%)", "10");
			type("PMI rate (per year)", "-1");
			expect(screen.getByText("PMI rate cannot be negative")).toBeTruthy();
		});
	});

	describe("itemized monthly estimate (S-6)", () => {
		const card = () =>
			screen.getByRole("region", { name: "Estimated monthly cost" });
		const row = (label: string) =>
			within(card()).getByText(label).closest("div") as HTMLElement;

		it("itemizes the golden case and includes the disclaimer", () => {
			render(<LoanCalculator />);
			type("Annual homeowners insurance", "1800");
			type("Monthly HOA", "100");
			expect(
				within(row("Principal and interest")).getByText("$2,528.27"),
			).toBeTruthy();
			expect(within(row("Property tax")).getByText("$833.33")).toBeTruthy();
			expect(
				within(row("Homeowners insurance")).getByText("$150.00"),
			).toBeTruthy();
			expect(within(row("Lender payment")).getByText("$3,511.60")).toBeTruthy();
			expect(within(row("HOA")).getByText("$100.00")).toBeTruthy();
			expect(within(card()).getByText("$3,611.60")).toBeTruthy();
			expect(within(card()).getByLabelText("Disclaimer")).toBeTruthy();
		});

		it("lists PMI in the lender payment group when it is on", () => {
			render(<LoanCalculator />);
			type("Down payment (%)", "10");
			expect(within(card()).getByText("PMI")).toBeTruthy();
			const escrow = within(card())
				.getByRole("heading", { name: "Lender payment (escrow)" })
				.closest("div") as HTMLElement;
			expect(within(escrow).getByText("PMI")).toBeTruthy();
		});

		it("asks to fix the fields while an input is invalid", () => {
			render(<LoanCalculator />);
			type("Monthly HOA", "-1");
			expect(
				within(card()).getByText(
					"Fix the highlighted fields to see the itemized monthly estimate.",
				),
			).toBeTruthy();
		});
	});

	describe("5/6 ARM", () => {
		const chooseArm = () => fireEvent.click(screen.getByLabelText("5/6 ARM"));
		const scheduleRows = () => {
			fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
			const table = screen.getByRole("table");
			// Drop the header row.
			return within(table).getAllByRole("row").slice(1);
		};

		it("is a fixed-rate loan with no ARM controls until 5/6 ARM is chosen", () => {
			render(<LoanCalculator />);
			expect(
				(screen.getByLabelText("Fixed rate") as HTMLInputElement).checked,
			).toBe(true);
			expect(screen.queryByText("5/6 ARM terms")).toBeNull();
			expect(screen.queryByText("Hypothetical rate")).toBeNull();
		});

		it("shows the terms, the start rate and the index presets", () => {
			render(<LoanCalculator />);
			chooseArm();
			expect(field("Start rate").value).toBe("6.50");
			expect(field("Margin").value).toBe("2.75");
			expect(field("Initial cap").value).toBe("2.00");
			expect(field("Periodic cap").value).toBe("1.00");
			expect(field("Lifetime cap").value).toBe("5.00");
			const presets = within(
				screen.getByRole("group", { name: "Index path after month 60" }),
			).getAllByRole("radio") as HTMLInputElement[];
			expect(presets.map((radio) => radio.value)).toEqual([
				"flat",
				"plus-one-per-year",
				"shock",
			]);
		});

		it("labels rows 61 and later 'Hypothetical rate' and rows 1 to 60 not", () => {
			render(<LoanCalculator />);
			chooseArm();
			const rows = scheduleRows();
			expect(rows).toHaveLength(360);
			rows.forEach((row, index) => {
				const labelled = within(row).queryByText("Hypothetical rate") !== null;
				expect(labelled, `month ${index + 1}`).toBe(index >= 60);
			});
		});

		it("labels the yearly rows from year 6 on", () => {
			render(<LoanCalculator />);
			chooseArm();
			const table = screen.getByRole("table");
			const rows = within(table).getAllByRole("row").slice(1);
			expect(rows).toHaveLength(30);
			rows.forEach((row, index) => {
				const labelled = within(row).queryByText("Hypothetical rate") !== null;
				expect(labelled, `year ${index + 1}`).toBe(index >= 5);
			});
		});

		it("switches the schedule to the ARM engine for the shock preset", () => {
			render(<LoanCalculator />);
			chooseArm();
			fireEvent.click(screen.getByLabelText("Shock"));
			const rows = scheduleRows();
			// Month 61 resets 6.50% to 8.50%; month 60 is still 6.50%.
			expect(within(rows[59] as HTMLElement).getByText("6.50%")).toBeTruthy();
			expect(within(rows[60] as HTMLElement).getByText("8.50%")).toBeTruthy();
			expect(
				within(rows[60] as HTMLElement).getByText("$3,015.13"),
			).toBeTruthy();
		});

		it("shows the first-period payment and flags the reset risk", () => {
			render(<LoanCalculator />);
			chooseArm();
			fireEvent.click(screen.getByLabelText("Shock"));
			const estimate = within(
				screen.getByRole("region", { name: "Estimated monthly cost" }),
			);
			expect(
				estimate.getByText("Principal and interest (months 1–60)"),
			).toBeTruthy();
			expect(estimate.getByText(/Reset risk/)).toBeTruthy();
			expect(estimate.getByText("Hypothetical rate")).toBeTruthy();
		});

		it("shows an error and no result when a cap is above 100%", () => {
			render(<LoanCalculator />);
			chooseArm();
			type("Initial cap", "101");
			expect(
				screen.getByText("Initial cap cannot be more than 100%"),
			).toBeTruthy();
			expect(screen.queryByRole("table")).toBeNull();
			expect(
				screen.queryByText("Reset risk: this payment is for months 1 to 60"),
			).toBeNull();
			expect(
				screen.queryByText("Principal and interest (months 1–60)"),
			).toBeNull();
		});

		it("returns to the fixed-rate result when Fixed rate is chosen again", () => {
			render(<LoanCalculator />);
			chooseArm();
			fireEvent.click(screen.getByLabelText("Fixed rate"));
			expect(screen.queryByText("Hypothetical rate")).toBeNull();
			expect(screen.queryByText("5/6 ARM terms")).toBeNull();
			expect(piSummary().getByText("$2,528.27")).toBeTruthy();
		});
	});

	describe("input validation", () => {
		const estimate = () =>
			within(screen.getByRole("region", { name: "Estimated monthly cost" }));

		it("shows an error and no result for a rate of 31%", () => {
			render(<LoanCalculator />);
			type("Interest rate", "31");
			expect(
				screen.getByText("Interest rate cannot be more than 30%"),
			).toBeTruthy();
			expect(estimate().queryByText(/month total/)).toBeNull();
			expect(screen.queryByRole("table")).toBeNull();
		});

		it("shows an error and no result for a rate of -1%", () => {
			render(<LoanCalculator />);
			type("Interest rate", "-1");
			expect(
				screen.getByText("An interest rate cannot be negative"),
			).toBeTruthy();
			expect(estimate().queryByText(/month total/)).toBeNull();
		});

		it("shows the exact message when the down payment is above the price", () => {
			render(<LoanCalculator />);
			fireEvent.click(screen.getByRole("button", { name: "Dollar amount" }));
			type("Down payment ($)", "600000");
			expect(
				screen.getByText("Down payment cannot be more than the price"),
			).toBeTruthy();
			expect(estimate().queryByText(/month total/)).toBeNull();
		});

		it("keeps the last valid result when a money field holds text", () => {
			render(<LoanCalculator />);
			expect(estimate().getByText(/month total/)).toBeTruthy();
			const before =
				estimate().getByText(/month total/).parentElement?.textContent;
			type("Monthly HOA", "abc");
			expect(screen.getByText("Monthly HOA must be a number")).toBeTruthy();
			expect(
				estimate().getByText(/month total/).parentElement?.textContent,
			).toBe(before);
			expect(screen.getByRole("status").textContent).toContain("last valid");
			expect(screen.getByRole("table")).toBeTruthy();
			// Fixing the field clears the notice and updates the result.
			type("Monthly HOA", "100");
			expect(screen.queryByRole("status")).toBeNull();
			expect(estimate().getAllByText("$100.00").length).toBeGreaterThan(0);
		});

		it("clears the result when text is combined with an out-of-range rate", () => {
			render(<LoanCalculator />);
			type("Monthly HOA", "abc");
			type("Interest rate", "31");
			expect(estimate().queryByText(/month total/)).toBeNull();
			expect(screen.queryByRole("status")).toBeNull();
		});

		it("links each error to its input with aria-invalid and aria-describedby", () => {
			render(<LoanCalculator />);
			const rate = field("Interest rate");
			expect(rate.getAttribute("aria-invalid")).toBeNull();
			expect(rate.getAttribute("aria-describedby")).toBeNull();
			type("Interest rate", "31");
			expect(rate.getAttribute("aria-invalid")).toBe("true");
			const message = screen.getByText("Interest rate cannot be more than 30%");
			expect(rate.getAttribute("aria-describedby")).toContain(message.id);
		});

		it("announces errors to screen readers and does not rely on color alone", () => {
			render(<LoanCalculator />);
			type("Interest rate", "31");
			const alert = screen.getByRole("alert");
			expect(alert.textContent).toContain(
				"Interest rate cannot be more than 30%",
			);
			expect(alert.textContent).toContain("⚠");
		});

		it("labels every text input", () => {
			render(<LoanCalculator />);
			for (const input of screen.getAllByRole("textbox")) {
				expect(
					(input as HTMLInputElement).labels?.length,
					input.outerHTML,
				).toBeGreaterThan(0);
			}
		});
	});

	describe("closing costs and cash to close", () => {
		const cash = () =>
			within(screen.getByRole("region", { name: "Cash to close" }));

		it("shows the down payment as the cash to close with no closing costs", () => {
			render(<LoanCalculator />);
			expect(cash().getAllByText("$100,000.00").length).toBeGreaterThan(0);
		});

		it("shows $112,000.00 for $100,000 down and $12,000 of closing costs", () => {
			render(<LoanCalculator />);
			type("Other closing costs", "12000");
			expect(cash().getAllByText("$112,000.00").length).toBeGreaterThan(0);
			expect(cash().getByText("Closing costs total")).toBeTruthy();
		});

		it("shows the dollar value next to a percent closing cost", () => {
			render(<LoanCalculator />);
			fireEvent.click(
				screen.getByRole("button", {
					name: "Other closing costs as percent of price",
				}),
			);
			type("Other closing costs", "2.5");
			expect(screen.getByText("= $12,500.00")).toBeTruthy();
			expect(cash().getAllByText("$112,500.00").length).toBeGreaterThan(0);
		});

		it("lists each line and they add up to the total", () => {
			render(<LoanCalculator />);
			type("Lender fees", "3000");
			type("Title and settlement fees", "2000");
			type("Prepaids and escrow deposits", "7000");
			expect(cash().getByText("$3,000.00")).toBeTruthy();
			expect(cash().getByText("$2,000.00")).toBeTruthy();
			expect(cash().getByText("$7,000.00")).toBeTruthy();
			const total = cash().getByText("Closing costs total").nextElementSibling;
			expect(total?.textContent).toBe("$12,000.00");
		});

		it("subtracts credits", () => {
			render(<LoanCalculator />);
			type("Other closing costs", "12000");
			type("Credits (seller or lender)", "2500");
			expect(cash().getAllByText("$109,500.00").length).toBeGreaterThan(0);
			expect(cash().getByText("-$2,500.00")).toBeTruthy();
		});

		it("shows an error and no cash to close for credits that are too large", () => {
			render(<LoanCalculator />);
			type("Credits (seller or lender)", "200000");
			expect(
				screen.getByText(
					"Credits cannot be more than the down payment plus closing costs",
				),
			).toBeTruthy();
			expect(cash().queryByText("Down payment")).toBeNull();
		});

		it("clears the text when switching between dollars and percent", () => {
			render(<LoanCalculator />);
			type("Other closing costs", "12000");
			fireEvent.click(
				screen.getByRole("button", {
					name: "Other closing costs as percent of price",
				}),
			);
			expect(field("Other closing costs").value).toBe("");
		});
	});
});

describe("LoanCalculator affordability", () => {
	const affordability = () =>
		within(screen.getByRole("region", { name: "Simplified affordability" }));

	it("always shows the not-a-loan-approval statement", () => {
		render(<LoanCalculator />);
		expect(affordability().getByText(/not a loan approval/i)).toBeTruthy();
		type("Gross monthly income", "10000");
		expect(affordability().getByText(/not a loan approval/i)).toBeTruthy();
	});

	it("asks for income and shows an error for zero income", () => {
		render(<LoanCalculator />);
		expect(
			affordability().getByText(/Enter your gross monthly income/),
		).toBeTruthy();
		type("Gross monthly income", "0");
		expect(screen.getByText("Income must be more than $0")).toBeTruthy();
	});

	it("marks an above-guideline ratio with text", () => {
		render(<LoanCalculator />);
		type("Gross monthly income", "3000");
		expect(affordability().getAllByText(/Above guideline/).length).toBe(2);
		type("Gross monthly income", "100000");
		expect(affordability().queryByText(/Above guideline/)).toBeNull();
	});

	it("lists the thresholds in the assumptions panel and applies edits", () => {
		render(<LoanCalculator />);
		type("Gross monthly income", "10000");
		expect(screen.getByText("Front-end limit (housing / income)")).toBeTruthy();
		type("Front-end limit", "40");
		expect(screen.getAllByText("40.0%").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Overridden").length).toBeGreaterThan(0);
	});
});

describe("LoanCalculator extra payments", () => {
	it("shows payoff month and interest saved", () => {
		render(<LoanCalculator />);
		type("Extra payment each month (optional)", "200");
		const summary = within(
			screen.getByRole("region", { name: "With extra payments" }),
		);
		expect(summary.getByText("Month 293")).toBeTruthy();
		expect(summary.getByText("$111,892.52")).toBeTruthy();
	});

	it("shows an error for a lump sum without a month", () => {
		render(<LoanCalculator />);
		type("One-time lump sum (optional)", "5000");
		type("Lump sum month", "");
		expect(screen.getByText("Enter the month of the lump sum")).toBeTruthy();
	});

	it("says extras are for fixed-rate loans when ARM is chosen", () => {
		render(<LoanCalculator />);
		fireEvent.click(screen.getByLabelText(/ARM/));
		expect(screen.getByText(/fixed-rate loans only/)).toBeTruthy();
	});
});
