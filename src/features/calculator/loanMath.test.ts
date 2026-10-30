import { describe, expect, it } from "vitest";
import type { Cents, Micros } from "@/types/units";
import {
	centsToFieldText,
	DOWN_PAYMENT_TOO_HIGH,
	deriveLoan,
	downPaymentFromPercent,
	ltvFor,
	microsToPercentText,
	percentFromDownPayment,
} from "./loanMath";
import type { CalculatorInputs } from "./types";

const inputs = (
	overrides: Partial<CalculatorInputs> = {},
): CalculatorInputs => ({
	homePrice: "500000",
	downPaymentPercent: "20",
	downPaymentAmount: "100000",
	downPaymentMode: "percent",
	termYears: 30,
	interestRate: "6.5",
	...overrides,
});

describe("deriveLoan", () => {
	it("derives $400,000 and 80.00% LTV for $500,000 with 20% down", () => {
		const { loan, errors } = deriveLoan(inputs());
		expect(errors).toEqual({});
		expect(loan?.loanAmount).toBe(40_000_000);
		expect(loan?.ltv).toBe(800_000);
		expect(loan?.monthlyPrincipalAndInterest).toBe(252_827);
		expect(loan?.downPayment).toBe(10_000_000);
		expect(loan?.interestRate).toBe(65_000);
		expect(loan?.termYears).toBe(30);
	});

	it("gives the same result from a dollar amount", () => {
		const { loan } = deriveLoan(
			inputs({ downPaymentMode: "amount", downPaymentAmount: "100,000" }),
		);
		expect(loan?.loanAmount).toBe(40_000_000);
		expect(loan?.downPaymentPercent).toBe(200_000);
	});

	it("handles 0% down: loan equals price and LTV is 100%", () => {
		const { loan } = deriveLoan(inputs({ downPaymentPercent: "0" }));
		expect(loan?.loanAmount).toBe(50_000_000);
		expect(loan?.ltv).toBe(1_000_000);
	});

	it("handles 100% down: loan is $0 and LTV is 0%", () => {
		const { loan } = deriveLoan(inputs({ downPaymentPercent: "100" }));
		expect(loan?.loanAmount).toBe(0);
		expect(loan?.ltv).toBe(0);
		expect(loan?.monthlyPrincipalAndInterest).toBe(0);
		const dollars = deriveLoan(
			inputs({ downPaymentMode: "amount", downPaymentAmount: "500000" }),
		);
		expect(dollars.loan?.loanAmount).toBe(0);
	});

	it("rounds a fractional-cent down payment half up", () => {
		// 12.345% of $100,001.00 = $12,345.12345 -> 1,234,512 cents
		const { loan } = deriveLoan(
			inputs({ homePrice: "100001", downPaymentPercent: "12.345" }),
		);
		expect(loan?.downPayment).toBe(1_234_512);
	});

	describe("errors", () => {
		it("rejects a down payment above the price with the PRD message", () => {
			const result = deriveLoan(
				inputs({ downPaymentMode: "amount", downPaymentAmount: "500000.01" }),
			);
			expect(result.errors.downPayment).toBe(DOWN_PAYMENT_TOO_HIGH);
			expect(DOWN_PAYMENT_TOO_HIGH).toBe(
				"Down payment cannot be more than the price",
			);
			expect(result.loan).toBeNull();
		});

		it("rejects a percent above 100", () => {
			const { errors } = deriveLoan(inputs({ downPaymentPercent: "100.01" }));
			expect(errors.downPayment).toBe("Down payment cannot be more than 100%");
		});

		it.each([
			["", "Enter a home price"],
			["abc", "A home price must be a number"],
			["-5", "A home price cannot be negative"],
			["0", "Home price must be more than $0"],
			["10,000,000.01", "Home price cannot be more than $10,000,000"],
		])("rejects home price %j", (homePrice, message) => {
			const { errors, loan } = deriveLoan(inputs({ homePrice }));
			expect(errors.homePrice).toBe(message);
			expect(loan).toBeNull();
		});

		it("rejects bad rate and down payment text without a result", () => {
			const result = deriveLoan(
				inputs({ interestRate: "x", downPaymentPercent: "" }),
			);
			expect(result.errors.interestRate).toBe(
				"An interest rate must be a number",
			);
			expect(result.errors.downPayment).toBe("Enter a down payment");
			expect(result.loan).toBeNull();
		});

		it("accepts the maximum price", () => {
			expect(
				deriveLoan(inputs({ homePrice: "10,000,000" })).loan?.loanAmount,
			).toBe(800_000_000);
		});
	});
});

describe("percent and dollar conversion", () => {
	const price = 50_000_000 as Cents;

	it("converts both ways", () => {
		expect(downPaymentFromPercent(price, 200_000 as Micros)).toBe(10_000_000);
		expect(percentFromDownPayment(price, 10_000_000 as Cents)).toBe(200_000);
		expect(ltvFor(price, 40_000_000 as Cents)).toBe(800_000);
	});

	it("round-trips whole-dollar amounts at typical prices", () => {
		for (const dollars of [0, 1, 7_777, 100_000, 499_999, 500_000]) {
			const down = (dollars * 100) as Cents;
			const pct = percentFromDownPayment(price, down);
			expect(
				Math.abs(downPaymentFromPercent(price, pct) - down),
			).toBeLessThanOrEqual(1);
		}
	});
});

describe("field text helpers", () => {
	it.each([
		[10_000_000, "100,000.00"],
		[5, "0.05"],
		[0, "0.00"],
	])("formats %i cents as %s", (cents, text) => {
		expect(centsToFieldText(cents as Cents)).toBe(text);
	});

	it.each([
		[200_000, "20.00"],
		[1_000_000, "100.00"],
		[0, "0.00"],
		[5_000, "0.50"],
		[123_450, "12.35"],
	])("formats %i micros as %s", (micros, text) => {
		expect(microsToPercentText(micros as Micros)).toBe(text);
	});
});
