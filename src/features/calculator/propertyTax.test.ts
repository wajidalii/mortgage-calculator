import { describe, expect, it } from "vitest";
import type { Cents, Micros } from "@/types/units";
import { initialCalculatorState } from "./calculatorReducer";
import { annualTaxFor, derivePropertyTax, monthlyTaxes } from "./propertyTax";
import type { CalculatorInputs } from "./types";

const inputs = (
	overrides: Partial<CalculatorInputs> = {},
): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	homePrice: "500,000",
	...overrides,
});

describe("annualTaxFor", () => {
	it("rounds price x rate half up to the cent", () => {
		expect(annualTaxFor(50_000_000 as Cents, 20_000 as Micros)).toBe(1_000_000);
		// $333,333.33 x 1.10% = $3,666.6666 -> $3,666.67
		expect(annualTaxFor(33_333_333 as Cents, 11_000 as Micros)).toBe(366_667);
		// 1 cent x 0.5% would be 0.005 -> rounds half up to 0 here (0.005 cents)
		expect(annualTaxFor(1 as Cents, 9_500 as Micros)).toBe(0);
	});
});

describe("monthlyTaxes", () => {
	it("splits $10,000.00 into $833.33 months with $833.37 in month 12", () => {
		const months = monthlyTaxes(1_000_000 as Cents);
		expect(months).toHaveLength(12);
		expect(months.slice(0, 11).every((m) => m === 83_333)).toBe(true);
		expect(months[11]).toBe(83_337);
	});

	it("splits $8,000.00 into $666.67 months with $666.63 in month 12", () => {
		const months = monthlyTaxes(800_000 as Cents);
		expect(months[0]).toBe(66_667);
		expect(months[11]).toBe(66_663);
	});

	it("adds up to the annual value for awkward amounts", () => {
		const awkward = [
			0, 1, 5, 6, 7, 11, 13, 100, 99_999, 1_234_567, 987_654_321,
		];
		for (const annual of awkward) {
			const months = monthlyTaxes(annual as Cents);
			expect(months.reduce((a, b) => a + b, 0)).toBe(annual);
			expect(months.every((m) => Number.isInteger(m) && m >= 0)).toBe(true);
		}
	});

	it("never makes month 12 negative for tiny amounts, and matches PRD rounding otherwise", () => {
		expect(monthlyTaxes(7 as Cents)).toEqual([
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7,
		]);
		for (let annual = 0; annual <= 5_000; annual++) {
			const months = monthlyTaxes(annual as Cents);
			expect(Math.min(...months)).toBeGreaterThanOrEqual(0);
			const prd = Math.floor((2 * annual + 12) / 24);
			if (annual - prd * 11 >= 0) expect(months[0]).toBe(prd);
		}
	});

	it("adds up for every annual amount from $0.00 to $50.00", () => {
		for (let annual = 0; annual <= 5_000; annual++) {
			expect(monthlyTaxes(annual as Cents).reduce((a, b) => a + b, 0)).toBe(
				annual,
			);
		}
	});
});

describe("derivePropertyTax", () => {
	it("gives NJ on $500,000: annual $10,000.00, monthly $833.33", () => {
		const { tax, errors } = derivePropertyTax(inputs({ state: "NJ" }));
		expect(errors).toEqual({});
		expect(tax).toMatchObject({
			annual: 1_000_000,
			monthly: 83_333,
			source: "state",
		});
	});

	it("gives TX on $500,000: annual $8,000.00, monthly $666.67", () => {
		const { tax } = derivePropertyTax(inputs({ state: "TX" }));
		expect(tax).toMatchObject({
			annual: 800_000,
			monthly: 66_667,
			source: "state",
		});
	});

	it("uses the manual override when one is entered", () => {
		const { tax } = derivePropertyTax(inputs({ annualTaxOverride: "6,000" }));
		expect(tax).toMatchObject({
			annual: 600_000,
			monthly: 50_000,
			source: "manual",
		});
	});

	it("returns to the state rate when the override is cleared", () => {
		expect(
			derivePropertyTax(inputs({ annualTaxOverride: "  " })).tax?.source,
		).toBe("state");
	});

	it("accepts an override of $0", () => {
		expect(
			derivePropertyTax(inputs({ annualTaxOverride: "0" })).tax?.annual,
		).toBe(0);
	});

	it("rejects malformed, negative and oversized overrides", () => {
		for (const bad of ["abc", "-5", "1e3", "999,999,999,999"]) {
			const result = derivePropertyTax(inputs({ annualTaxOverride: bad }));
			expect(result.tax).toBeNull();
			expect(result.errors.annualTaxOverride).toBeTruthy();
		}
	});

	it("has no estimate, and no tax error, while the price is invalid", () => {
		const result = derivePropertyTax(inputs({ homePrice: "" }));
		expect(result.tax).toBeNull();
		expect(result.errors).toEqual({});
	});

	it("still honors a valid override when the price is invalid", () => {
		expect(
			derivePropertyTax(inputs({ homePrice: "", annualTaxOverride: "1200" }))
				.tax?.monthly,
		).toBe(10_000);
	});
});
