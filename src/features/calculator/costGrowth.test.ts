import { describe, expect, it } from "vitest";
import type { Cents, Micros } from "@/types/units";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveCostGrowth, grownAnnual } from "./costGrowth";
import { deriveMonthlyCosts } from "./monthlyCosts";
import { derivePropertyTax } from "./propertyTax";
import type { CalculatorInputs } from "./types";

const run = (o: Partial<CalculatorInputs> = {}) => {
	const inputs: CalculatorInputs = {
		...initialCalculatorState.inputs,
		// $10,000 a year of tax: $833.33 a month.
		annualTaxOverride: "10,000",
		annualInsurance: "2,400",
		termYears: 30,
		...o,
	};
	return deriveCostGrowth(
		inputs,
		derivePropertyTax(inputs).tax,
		deriveMonthlyCosts(inputs).costs,
	);
};

describe("grownAnnual", () => {
	it("grows by the rate, rounded half up in cents", () => {
		expect(grownAnnual(1_000_000 as Cents, 30_000 as Micros)).toBe(1_030_000);
		// 1 cent at 50% would be 1.5 cents, which rounds up to 2.
		expect(grownAnnual(1 as Cents, 500_000 as Micros)).toBe(2);
	});

	it("leaves the amount alone at 0%", () => {
		expect(grownAnnual(123_457 as Cents, 0 as Micros)).toBe(123_457);
	});

	it("does not overflow after 30 years at the 20% limit", () => {
		let annual = 1_000_000_000 as Cents;
		for (let i = 0; i < 29; i++)
			annual = grownAnnual(annual, 200_000 as Micros);
		expect(Number.isSafeInteger(annual)).toBe(true);
	});
});

describe("deriveCostGrowth", () => {
	it("bases year 2 tax on $858.33 a month for 3% growth on $833.33", () => {
		const { result } = run({ taxGrowth: "3" });
		expect(result?.years[0]?.monthlyTax).toBe(83_333);
		expect(result?.years[1]?.monthlyTax).toBe(85_833);
		expect(result?.years[1]?.annualTax).toBe(1_030_000);
		expect(result?.applied).toBe(true);
	});

	it("compounds year over year", () => {
		const { result } = run({ taxGrowth: "3" });
		expect(result?.years[2]?.annualTax).toBe(1_060_900);
	});

	it("keeps tax and insurance the same each year at 0%", () => {
		for (const o of [{}, { taxGrowth: "0", insuranceGrowth: "0" }]) {
			const { result } = run(o);
			expect(result?.applied).toBe(false);
			expect(new Set(result?.years.map((y) => y.annualTax)).size).toBe(1);
			expect(new Set(result?.years.map((y) => y.annualInsurance)).size).toBe(1);
		}
	});

	it("grows insurance separately", () => {
		const { result } = run({ insuranceGrowth: "5" });
		expect(result?.years[1]?.annualInsurance).toBe(252_000);
		expect(result?.years[1]?.annualTax).toBe(1_000_000);
	});

	it("has one row per loan year", () => {
		expect(run({ termYears: 15 }).result?.years).toHaveLength(15);
	});

	it("validates the growth text", () => {
		expect(run({ taxGrowth: "abc" }).errors.taxGrowth).toBeDefined();
		expect(run({ taxGrowth: "-1" }).errors.taxGrowth).toBe(
			"Tax growth cannot be negative",
		);
		expect(run({ insuranceGrowth: "21" }).errors.insuranceGrowth).toBe(
			"Insurance growth cannot be more than 20%",
		);
		expect(run({ taxGrowth: "abc" }).result).toBeNull();
	});
});
