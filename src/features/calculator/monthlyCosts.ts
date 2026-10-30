import { DEFAULTS } from "@/config/defaults/defaults";
import { parseMoney } from "@/lib/money";
import { roundHalfUp } from "@/lib/rounding";
import type { Cents } from "@/types/units";
import { MAX_HOME_PRICE } from "./loanMath";
import type { CalculatorInputs, ErrorField } from "./types";

const MONTHS = 12;

/** monthlyInsurance = round(annualInsurance / 12) (PRD 8.7). */
export const monthlyInsuranceFor = (annual: Cents): Cents =>
	roundHalfUp(annual, MONTHS) as Cents;

export interface MonthlyCosts {
	/** Base plus extra annual insurance, in cents. */
	annualInsurance: Cents;
	/** Escrow group: insurance, including the optional extra premium. */
	monthlyInsurance: Cents;
	/** True when the base insurance is the registry default, not user entered. */
	insuranceIsDefault: boolean;
	/** Optional extra annual premium the user entered (flood, wind). */
	extraAnnualInsurance: Cents;
	/** Non-escrow group. */
	monthlyHoa: Cents;
	monthlyOther: Cents;
}

export interface MonthlyCostsDerivation {
	costs: MonthlyCosts | null;
	errors: Partial<Record<ErrorField, string>>;
}

type Parsed = { value: Cents } | { error: string };

/** Optional non-negative money field. Empty counts as $0. */
const parseOptional = (text: string, label: string): Parsed => {
	if (text.trim() === "") return { value: 0 as Cents };
	const parsed = parseMoney(text);
	if (!parsed.ok) {
		return {
			error:
				parsed.error === "negative"
					? `${label} cannot be negative`
					: `${label} must be a number`,
		};
	}
	if (parsed.value > MAX_HOME_PRICE) return { error: `${label} is too large` };
	return { value: parsed.value };
};

/**
 * Insurance, HOA and other monthly costs (PRD 8.7). Invalid or negative
 * values give an error and are never used: `costs` is null until every
 * field is valid. Empty insurance uses the registry default.
 */
export const deriveMonthlyCosts = (
	inputs: CalculatorInputs,
): MonthlyCostsDerivation => {
	const errors: Partial<Record<ErrorField, string>> = {};
	const read = (
		field: ErrorField,
		text: string,
		label: string,
	): Cents | null => {
		const result = parseOptional(text, label);
		if ("error" in result) {
			errors[field] = result.error;
			return null;
		}
		return result.value;
	};

	const insuranceText = inputs.annualInsurance.trim();
	const insuranceIsDefault = insuranceText === "";
	const baseInsurance = insuranceIsDefault
		? DEFAULTS.homeownersInsurance.value
		: read("annualInsurance", inputs.annualInsurance, "Annual insurance");
	const extra = read(
		"extraAnnualInsurance",
		inputs.extraAnnualInsurance,
		"Extra annual insurance",
	);
	const hoa = read("monthlyHoa", inputs.monthlyHoa, "Monthly HOA");
	const other = read("monthlyOther", inputs.monthlyOther, "Other monthly cost");

	if (
		baseInsurance === null ||
		extra === null ||
		hoa === null ||
		other === null
	) {
		return { costs: null, errors };
	}
	const annualInsurance = (baseInsurance + extra) as Cents;
	return {
		costs: {
			annualInsurance,
			monthlyInsurance: monthlyInsuranceFor(annualInsurance),
			insuranceIsDefault,
			extraAnnualInsurance: extra,
			monthlyHoa: hoa,
			monthlyOther: other,
		},
		errors,
	};
};
