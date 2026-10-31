import { describe, expect, it } from "vitest";
import type { Cents } from "@/types/units";
import {
	breakEvenMonths,
	deriveRefinance,
	initialRefinanceInputs,
	type RefinanceInputs,
} from "./refinance";

const inputs = (o: Partial<RefinanceInputs> = {}): RefinanceInputs => ({
	balance: "300,000",
	remainingMonths: "300",
	currentRate: "7.5",
	newRate: "6.5",
	costs: "6,000",
	...o,
});

describe("deriveRefinance", () => {
	it("saves $191.35 and breaks even in 32 months (PRD 12.1)", () => {
		const { result } = deriveRefinance(inputs());
		expect(result?.monthlySaving).toBe(19_135);
		expect(result?.breakEvenMonths).toBe(32);
		expect(result?.termMonths).toBe(300);
	});

	it("shows no break-even when the new payment is equal or higher", () => {
		const equal = deriveRefinance(inputs({ newRate: "7.5" })).result;
		expect(equal?.monthlySaving).toBe(0);
		expect(equal?.breakEvenMonths).toBeNull();
		const higher = deriveRefinance(inputs({ newRate: "8" })).result;
		expect(higher?.monthlySaving).toBeLessThan(0);
		expect(higher?.breakEvenMonths).toBeNull();
	});

	it("does not divide by zero on a zero saving", () => {
		expect(() => deriveRefinance(inputs({ newRate: "7.5" }))).not.toThrow();
	});

	it("treats blank costs as $0 with a 0 month break-even", () => {
		const { result } = deriveRefinance(inputs({ costs: "" }));
		expect(result?.breakEvenMonths).toBe(0);
	});

	it("rounds the break-even up", () => {
		expect(breakEvenMonths(10_000 as Cents, 3_000 as Cents)).toBe(4);
		expect(breakEvenMonths(9_000 as Cents, 3_000 as Cents)).toBe(3);
	});

	it("validates every field", () => {
		const { errors, result } = deriveRefinance(initialRefinanceInputs);
		expect(result).toBeNull();
		expect(Object.keys(errors).sort()).toEqual(
			["balance", "currentRate", "newRate", "remainingMonths"].sort(),
		);
		expect(
			deriveRefinance(inputs({ remainingMonths: "481" })).errors
				.remainingMonths,
		).toBeDefined();
		expect(
			deriveRefinance(inputs({ remainingMonths: "12.5" })).errors
				.remainingMonths,
		).toBeDefined();
		expect(deriveRefinance(inputs({ balance: "0" })).errors.balance).toBe(
			"Balance must be more than $0",
		);
		expect(deriveRefinance(inputs({ newRate: "31" })).errors.newRate).toBe(
			"Interest rate cannot be more than 30%",
		);
	});
});
