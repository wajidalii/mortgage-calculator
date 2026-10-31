import { describe, expect, it } from "vitest";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveLoan } from "./loanMath";
import { buildRateSensitivity, RATE_STEP } from "./rateSensitivity";
import type { CalculatorInputs } from "./types";

const loanFor = (o: Partial<CalculatorInputs> = {}) => {
	const { loan } = deriveLoan({
		...initialCalculatorState.inputs,
		homePrice: "500,000",
		downPaymentPercent: "20",
		downPaymentMode: "percent",
		termYears: 30,
		interestRate: "6.5",
		...o,
	});
	if (!loan) throw new Error("loan should be valid");
	return loan;
};

describe("buildRateSensitivity", () => {
	it("steps by 0.50 points", () => {
		expect(RATE_STEP).toBe(5000);
	});

	it("shows 5.50% to 7.50% around a 6.50% base for $400,000 over 30 years", () => {
		const rows = buildRateSensitivity(loanFor());
		expect(rows.map((r) => r.rate)).toEqual([
			55000, 60000, 65000, 70000, 75000,
		]);
		const base = rows.find((r) => r.isBase);
		expect(base?.payment).toBe(252_827);
		expect(base?.difference).toBe(0);
	});

	it("has rising payments as the rate rises", () => {
		const payments = buildRateSensitivity(loanFor()).map((r) => r.payment);
		expect(payments).toEqual([...payments].sort((a, b) => a - b));
		expect(new Set(payments).size).toBe(5);
	});

	it("moves every row with the base rate", () => {
		const rows = buildRateSensitivity(loanFor({ interestRate: "4" }));
		expect(rows.map((r) => r.rate)).toEqual([
			30000, 35000, 40000, 45000, 50000,
		]);
	});

	it("leaves out rows below 0% and keeps 0%", () => {
		const rows = buildRateSensitivity(loanFor({ interestRate: "0.5" }));
		expect(rows.map((r) => r.rate)).toEqual([0, 5000, 10000, 15000]);
		expect(rows[1]?.isBase).toBe(true);
	});
});
