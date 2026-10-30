import { describe, expect, it } from "vitest";
import {
	calculatorReducer,
	initialCalculatorState,
	syncDownPayment,
} from "./calculatorReducer";
import type { CalculatorAction, CalculatorState } from "./types";

const run = (...actions: CalculatorAction[]): CalculatorState =>
	actions.reduce(calculatorReducer, initialCalculatorState);

describe("calculatorReducer", () => {
	it("starts with a 30 year term and percent entry", () => {
		expect(initialCalculatorState.inputs.termYears).toBe(30);
		expect(initialCalculatorState.inputs.downPaymentMode).toBe("percent");
	});

	it("does not touch the other down payment field while typing", () => {
		const state = run({
			type: "edit",
			field: "downPaymentPercent",
			value: "25",
		});
		expect(state.inputs.downPaymentPercent).toBe("25");
		expect(state.inputs.downPaymentAmount).toBe("100,000.00");
	});

	it("syncs the dollar amount from the percent on blur", () => {
		const state = run(
			{ type: "edit", field: "downPaymentPercent", value: "25" },
			{ type: "blur", field: "downPaymentPercent" },
		);
		expect(state.inputs.downPaymentAmount).toBe("125,000.00");
		expect(state.touched.downPayment).toBe(true);
	});

	it("syncs the percent from the dollar amount in amount mode", () => {
		const state = run(
			{ type: "setDownPaymentMode", mode: "amount" },
			{ type: "edit", field: "downPaymentAmount", value: "150000" },
			{ type: "blur", field: "downPaymentAmount" },
		);
		expect(state.inputs.downPaymentPercent).toBe("30.00");
	});

	it("keeps the percent when the price changes in percent mode", () => {
		const state = run(
			{ type: "edit", field: "homePrice", value: "600000" },
			{ type: "blur", field: "homePrice" },
		);
		expect(state.inputs.downPaymentPercent).toBe("20.00");
		expect(state.inputs.downPaymentAmount).toBe("120,000.00");
		expect(state.touched.homePrice).toBe(true);
	});

	it("leaves the counterpart alone when the source is invalid", () => {
		const state = run(
			{ type: "edit", field: "downPaymentPercent", value: "abc" },
			{ type: "blur", field: "downPaymentPercent" },
		);
		expect(state.inputs.downPaymentAmount).toBe("100,000.00");
	});

	it("does not sync on interest rate blur but marks it touched", () => {
		const state = run({ type: "blur", field: "interestRate" });
		expect(state.touched.interestRate).toBe(true);
		expect(state.inputs).toEqual(initialCalculatorState.inputs);
	});

	it("sets the term", () => {
		expect(run({ type: "setTerm", years: 15 }).inputs.termYears).toBe(15);
	});
});

describe("syncDownPayment", () => {
	it("is a no-op for an invalid price", () => {
		const inputs = { ...initialCalculatorState.inputs, homePrice: "" };
		expect(syncDownPayment(inputs)).toBe(inputs);
	});
});
