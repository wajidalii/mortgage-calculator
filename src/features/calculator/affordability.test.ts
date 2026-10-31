import { describe, expect, it } from "vitest";
import type { Cents } from "@/types/units";
import { deriveAffordability, ratioMicros } from "./affordability";
import { initialCalculatorState } from "./calculatorReducer";
import type { MonthlyEstimate } from "./monthlyEstimate";
import type { CalculatorInputs } from "./types";

const estimate = (lender: number, hoa = 0): MonthlyEstimate => ({
	lender: [],
	lenderPayment: lender as Cents,
	nonEscrow: [{ id: "hoa", label: "HOA", amount: hoa as Cents }],
	nonEscrowTotal: hoa as Cents,
	total: (lender + hoa) as Cents,
});

const inputs = (overrides: Partial<CalculatorInputs>): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	...overrides,
});

describe("ratioMicros", () => {
	it("rounds to one decimal, half up", () => {
		expect(ratioMicros(300000 as Cents, 1000000 as Cents)).toBe(300000);
		// 28.05% rounds up to 28.1%.
		expect(ratioMicros(2805 as Cents, 10000 as Cents)).toBe(281000);
		// 28.049% rounds down to 28.0%.
		expect(ratioMicros(280490 as Cents, 1000000 as Cents)).toBe(280000);
	});
});

describe("deriveAffordability", () => {
	it("gives 30.0% front-end and 35.0% back-end for the golden case", () => {
		const { result } = deriveAffordability(
			inputs({ grossMonthlyIncome: "10,000", otherMonthlyDebt: "500" }),
			estimate(300000),
		);
		expect(result?.frontEnd.ratio).toBe(300000);
		expect(result?.backEnd.ratio).toBe(350000);
		expect(result?.frontEnd.above).toBe(true);
		expect(result?.backEnd.above).toBe(false);
	});

	it("counts HOA in housing but not other monthly costs", () => {
		const { result } = deriveAffordability(
			inputs({ grossMonthlyIncome: "10000" }),
			estimate(250000, 30000),
		);
		expect(result?.housing).toBe(280000);
		expect(result?.frontEnd.ratio).toBe(280000);
		expect(result?.frontEnd.above).toBe(false);
	});

	it("flags a ratio only when it is above the threshold", () => {
		const at = deriveAffordability(
			inputs({ grossMonthlyIncome: "10000", otherMonthlyDebt: "800" }),
			estimate(280000),
		).result;
		expect(at?.backEnd.ratio).toBe(360000);
		expect(at?.backEnd.above).toBe(false);
		const over = deriveAffordability(
			inputs({ grossMonthlyIncome: "10000", otherMonthlyDebt: "810" }),
			estimate(280000),
		).result;
		expect(over?.backEnd.above).toBe(true);
	});

	it("uses edited thresholds", () => {
		const { result } = deriveAffordability(
			inputs({
				grossMonthlyIncome: "10000",
				dtiFrontEnd: "31",
				dtiBackEnd: "40.5",
			}),
			estimate(300000),
		);
		expect(result?.frontEnd.above).toBe(false);
		expect(result?.frontEnd.thresholdIsDefault).toBe(false);
		expect(result?.backEnd.threshold).toBe(405000);
	});

	it("shows an input error for blank or zero income, with no division", () => {
		const blank = deriveAffordability(inputs({}), estimate(300000));
		expect(blank.result).toBeNull();
		expect(blank.errors.grossMonthlyIncome).toBe(
			"Enter your gross monthly income",
		);
		const zero = deriveAffordability(
			inputs({ grossMonthlyIncome: "0" }),
			estimate(300000),
		);
		expect(zero.result).toBeNull();
		expect(zero.errors.grossMonthlyIncome).toBe("Income must be more than $0");
	});

	it("rejects bad debt and threshold text", () => {
		const { errors, result } = deriveAffordability(
			inputs({
				grossMonthlyIncome: "10000",
				otherMonthlyDebt: "abc",
				dtiFrontEnd: "0",
				dtiBackEnd: "150",
			}),
			estimate(300000),
		);
		expect(result).toBeNull();
		expect(errors.otherMonthlyDebt).toBeDefined();
		expect(errors.dtiFrontEnd).toBe("Front-end limit must be more than 0%");
		expect(errors.dtiBackEnd).toBe("Back-end limit cannot be more than 100%");
	});

	it("has no result without a payment estimate", () => {
		const { result, errors } = deriveAffordability(
			inputs({ grossMonthlyIncome: "10000" }),
			null,
		);
		expect(result).toBeNull();
		expect(errors).toEqual({});
	});
});
