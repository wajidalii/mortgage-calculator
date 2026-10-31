import { describe, expect, it } from "vitest";
import { deriveArm, indexPathFor } from "./armSchedule";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveLoan } from "./loanMath";
import type { CalculatorInputs } from "./types";

const armInputs = (
	overrides: Partial<CalculatorInputs> = {},
): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	homePrice: "500000",
	loanType: "arm",
	...overrides,
});

const derive = (overrides: Partial<CalculatorInputs> = {}) => {
	const inputs = armInputs(overrides);
	return deriveArm(inputs, deriveLoan(inputs).loan);
};

describe("indexPathFor", () => {
	it("holds flat at 3.75%", () => {
		const path = indexPathFor("flat");
		expect(path(61)).toBe(37_500);
		expect(path(300)).toBe(37_500);
	});

	it("adds 1 point for every full year after month 61", () => {
		const path = indexPathFor("plus-one-per-year");
		expect(path(61)).toBe(37_500);
		expect(path(72)).toBe(37_500);
		expect(path(73)).toBe(47_500);
		expect(path(85)).toBe(57_500);
	});

	it("jumps to 9.00% at month 61", () => {
		const path = indexPathFor("shock");
		expect(path(60)).toBe(37_500);
		expect(path(61)).toBe(90_000);
	});
});

describe("deriveArm", () => {
	it("returns nothing for a fixed loan", () => {
		const inputs = armInputs({ loanType: "fixed" });
		expect(deriveArm(inputs, deriveLoan(inputs).loan)).toEqual({
			errors: {},
			result: null,
		});
	});

	it("keeps the rate and payment through the fixed period", () => {
		const result = derive().result;
		const first = result?.rows[0];
		expect(first?.rate).toBe(65_000);
		expect(first?.scheduledPayment).toBe(252_827);
		expect(result?.rows[59]?.hypothetical).toBe(false);
		expect(result?.rows[60]?.hypothetical).toBe(true);
	});

	it("follows PRD S-8 for the shock path: 8.50, 9.50, 10.50, 11.50", () => {
		const rows = derive({ armIndexPreset: "shock" }).result?.rows ?? [];
		const resets = rows.filter((row) => row.reset).slice(0, 4);
		expect(resets.map((row) => row.rate)).toEqual([
			85_000, 95_000, 105_000, 115_000,
		]);
		expect(resets[0]?.scheduledPayment).toBe(301_513);
	});

	it("summarizes the reset risk", () => {
		const shock = derive({ armIndexPreset: "shock" }).result?.summary;
		expect(shock?.firstPayment).toBe(252_827);
		expect(shock?.rises).toBe(true);
		expect(shock?.peakPayment).toBeGreaterThan(301_513);
		expect(shock?.peakRate).toBe(115_000);
		expect(shock?.presetLabel).toBe("Shock");
	});

	it("uses the margin as the floor when the floor is blank", () => {
		const blank = derive({ armIndexPreset: "flat", armFloor: "" });
		const explicit = derive({ armIndexPreset: "flat", armFloor: "2.75" });
		expect(blank.result?.rows).toEqual(explicit.result?.rows);
	});

	it("rejects a cap above 100% and returns no result", () => {
		const { errors, result } = derive({ armInitialCap: "101" });
		expect(errors.armInitialCap).toBe("Initial cap cannot be more than 100%");
		expect(result).toBeNull();
	});

	it("reports each invalid ARM field", () => {
		const { errors, result } = derive({
			armMargin: "abc",
			armFloor: "-1",
			armPeriodicCap: "",
			armLifetimeCap: "150",
		});
		expect(errors).toEqual({
			armMargin: "Margin must be a number",
			armFloor: "Floor cannot be negative",
			armPeriodicCap: "Enter periodic cap",
			armLifetimeCap: "Lifetime cap cannot be more than 100%",
		});
		expect(result).toBeNull();
	});

	it("validates the ARM fields even while the loan is invalid", () => {
		const inputs = armInputs({ homePrice: "", armLifetimeCap: "150" });
		const { errors, result } = deriveArm(inputs, deriveLoan(inputs).loan);
		expect(errors.armLifetimeCap).toBeDefined();
		expect(result).toBeNull();
	});
});
