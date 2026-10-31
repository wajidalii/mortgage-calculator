import { parseRate } from "@/lib/rate";
import type { Cents, Micros } from "@/types/units";
import { type MonthlyCosts, monthlyInsuranceFor } from "./monthlyCosts";
import { monthlyTaxes, type PropertyTax } from "./propertyTax";
import type { CalculatorInputs, ErrorField } from "./types";
import { parseMessage } from "./validation";

/** Yearly growth above 20% is rejected. */
export const MAX_GROWTH = 200_000 as Micros;

const MICROS_PER_WHOLE = 1_000_000n;

/**
 * One year of growth: round(annual x (1 + growth)), integer half-up. BigInt
 * because 30 years of compounding can leave the safe integer range in the
 * intermediate product.
 */
export const grownAnnual = (annual: Cents, growth: Micros): Cents => {
	const scaled = BigInt(annual) * (MICROS_PER_WHOLE + BigInt(growth));
	return Number(
		(scaled * 2n + MICROS_PER_WHOLE) / (MICROS_PER_WHOLE * 2n),
	) as Cents;
};

export interface GrowthYear {
	/** 1-based loan year. */
	year: number;
	annualTax: Cents;
	/** Months 1 to 11 of the year. */
	monthlyTax: Cents;
	annualInsurance: Cents;
	monthlyInsurance: Cents;
}

export interface CostGrowth {
	taxGrowth: Micros;
	insuranceGrowth: Micros;
	/** True when either growth is above 0%, so the result is an assumption. */
	applied: boolean;
	years: GrowthYear[];
}

export interface CostGrowthDerivation {
	errors: Partial<Record<ErrorField, string>>;
	result: CostGrowth | null;
}

/** Blank is 0%. */
const parseGrowth = (
	text: string,
	label: string,
): { value: Micros } | { error: string } => {
	if (text.trim() === "") return { value: 0 as Micros };
	const parsed = parseRate(text);
	if (!parsed.ok) return { error: parseMessage(label, parsed.error) };
	if (parsed.value > MAX_GROWTH)
		return { error: `${label} cannot be more than 20%` };
	return { value: parsed.value };
};

/**
 * Tax and insurance for each loan year with yearly growth (S-16). Year 1 is
 * the entered or default amount; each later year grows the previous annual
 * amount, in cents. The result is an assumption, not a forecast.
 */
export const deriveCostGrowth = (
	inputs: CalculatorInputs,
	tax: PropertyTax | null,
	costs: MonthlyCosts | null,
): CostGrowthDerivation => {
	const errors: CostGrowthDerivation["errors"] = {};
	const taxGrowth = parseGrowth(inputs.taxGrowth, "Tax growth");
	if ("error" in taxGrowth) errors.taxGrowth = taxGrowth.error;
	const insuranceGrowth = parseGrowth(
		inputs.insuranceGrowth,
		"Insurance growth",
	);
	if ("error" in insuranceGrowth) {
		errors.insuranceGrowth = insuranceGrowth.error;
	}
	if ("error" in taxGrowth || "error" in insuranceGrowth || !tax || !costs) {
		return { errors, result: null };
	}

	const years: GrowthYear[] = [];
	let annualTax = tax.annual;
	let annualInsurance = costs.annualInsurance;
	for (let year = 1; year <= inputs.termYears; year++) {
		if (year > 1) {
			annualTax = grownAnnual(annualTax, taxGrowth.value);
			annualInsurance = grownAnnual(annualInsurance, insuranceGrowth.value);
		}
		years.push({
			year,
			annualTax,
			monthlyTax: monthlyTaxes(annualTax)[0] as Cents,
			annualInsurance,
			monthlyInsurance: monthlyInsuranceFor(annualInsurance),
		});
	}
	return {
		errors,
		result: {
			taxGrowth: taxGrowth.value,
			insuranceGrowth: insuranceGrowth.value,
			applied: taxGrowth.value > 0 || insuranceGrowth.value > 0,
			years,
		},
	};
};
