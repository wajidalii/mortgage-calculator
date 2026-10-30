import { describe, expect, it } from "vitest";
import type { Cents } from "@/types/units";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveMonthlyCosts, monthlyInsuranceFor } from "./monthlyCosts";
import type { CalculatorInputs } from "./types";

const inputs = (o: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	...o,
});

describe("monthlyInsuranceFor", () => {
	it("gives $150.00 for $1,800 a year", () => {
		expect(monthlyInsuranceFor(180_000 as Cents)).toBe(15_000);
	});

	it("rounds half up to the cent", () => {
		// $1,000.00 / 12 = $83.333... -> $83.33
		expect(monthlyInsuranceFor(100_000 as Cents)).toBe(8_333);
		// 6 cents / 12 = 0.5 cent -> 1 cent (half up)
		expect(monthlyInsuranceFor(6 as Cents)).toBe(1);
		expect(monthlyInsuranceFor(5 as Cents)).toBe(0);
		// $2,400 default / 12 = $200.00
		expect(monthlyInsuranceFor(240_000 as Cents)).toBe(20_000);
	});
});

describe("deriveMonthlyCosts", () => {
	it("uses $1,800 insurance as $150.00 a month, not labeled default", () => {
		const { costs, errors } = deriveMonthlyCosts(
			inputs({ annualInsurance: "1,800" }),
		);
		expect(errors).toEqual({});
		expect(costs).toMatchObject({
			monthlyInsurance: 15_000,
			insuranceIsDefault: false,
		});
	});

	it("falls back to the $2,400 default when insurance is empty", () => {
		for (const empty of ["", "   "]) {
			const { costs } = deriveMonthlyCosts(inputs({ annualInsurance: empty }));
			expect(costs).toMatchObject({
				annualInsurance: 240_000,
				monthlyInsurance: 20_000,
				insuranceIsDefault: true,
			});
		}
	});

	it("keeps an explicit $0 insurance as $0, not the default", () => {
		const { costs } = deriveMonthlyCosts(inputs({ annualInsurance: "0" }));
		expect(costs).toMatchObject({
			monthlyInsurance: 0,
			insuranceIsDefault: false,
		});
	});

	it("passes HOA and other through as entered", () => {
		const { costs } = deriveMonthlyCosts(
			inputs({ monthlyHoa: "100", monthlyOther: "49.99" }),
		);
		expect(costs).toMatchObject({ monthlyHoa: 10_000, monthlyOther: 4_999 });
	});

	it("defaults HOA and other to $0 when empty", () => {
		expect(deriveMonthlyCosts(inputs()).costs).toMatchObject({
			monthlyHoa: 0,
			monthlyOther: 0,
			extraAnnualInsurance: 0,
		});
	});

	it("adds the optional extra annual insurance with no automatic premium", () => {
		expect(deriveMonthlyCosts(inputs()).costs?.annualInsurance).toBe(240_000);
		const { costs } = deriveMonthlyCosts(
			inputs({ annualInsurance: "1800", extraAnnualInsurance: "600" }),
		);
		expect(costs).toMatchObject({
			annualInsurance: 240_000,
			monthlyInsurance: 20_000,
			extraAnnualInsurance: 60_000,
		});
	});

	it("rejects negative values per field and uses none of them", () => {
		const cases = [
			["annualInsurance", "Annual insurance cannot be negative"],
			["extraAnnualInsurance", "Extra annual insurance cannot be negative"],
			["monthlyHoa", "Monthly HOA cannot be negative"],
			["monthlyOther", "Other monthly cost cannot be negative"],
		] as const;
		for (const [field, message] of cases) {
			const result = deriveMonthlyCosts(inputs({ [field]: "-1" }));
			expect(result.costs).toBeNull();
			expect(result.errors).toEqual({ [field]: message });
		}
	});

	it("rejects non-numbers and oversized values", () => {
		for (const bad of ["abc", "1,2,3", "999,999,999,999"]) {
			const result = deriveMonthlyCosts(inputs({ monthlyHoa: bad }));
			expect(result.costs).toBeNull();
			expect(result.errors.monthlyHoa).toBeTruthy();
		}
	});

	it("reports every invalid field at once", () => {
		const { errors } = deriveMonthlyCosts(
			inputs({ monthlyHoa: "-5", monthlyOther: "x" }),
		);
		expect(Object.keys(errors).sort()).toEqual(["monthlyHoa", "monthlyOther"]);
	});
});
