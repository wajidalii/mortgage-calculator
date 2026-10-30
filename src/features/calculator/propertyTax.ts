import { DEFAULTS } from "@/config/defaults/defaults";
import type { StateCode } from "@/config/defaults/stateTaxTable";
import { parseMoney } from "@/lib/money";
import { roundHalfUp } from "@/lib/rounding";
import type { Cents, Micros } from "@/types/units";
import { MAX_HOME_PRICE } from "./loanMath";
import type { CalculatorInputs, ErrorField } from "./types";

const MICROS_PER_WHOLE = 1_000_000;
const MONTHS = 12;

/** annualTax = round(H x demoRate), integer half-up (PRD 8.6). */
export const annualTaxFor = (price: Cents, rate: Micros): Cents =>
	roundHalfUp(price * rate, MICROS_PER_WHOLE) as Cents;

/**
 * The 12 monthly tax amounts (PRD 8.6). Months 1 to 11 are
 * round(annual / 12); month 12 takes the remainder so the months add up to the
 * annual value exactly. Month 12 can be a few cents above or below the others.
 *
 * Edge case: for annual amounts under about $1.32, rounding 11 months up can
 * overshoot the annual value and leave a negative month 12. Then months 1 to 11
 * round down instead, so no month is ever negative and the sum stays exact.
 */
export const monthlyTaxes = (annual: Cents): Cents[] => {
	let regular = roundHalfUp(annual, MONTHS);
	if (annual - regular * (MONTHS - 1) < 0)
		regular = Math.floor(annual / MONTHS);
	const last = annual - regular * (MONTHS - 1);
	return Array.from(
		{ length: MONTHS },
		(_, i) => (i === MONTHS - 1 ? last : regular) as Cents,
	);
};

export interface PropertyTax {
	annual: Cents;
	/** Months 1 to 11. */
	monthly: Cents;
	/** Month 12, which includes the rounding remainder. */
	lastMonth: Cents;
	source: "state" | "manual";
	state: StateCode;
	/** Rate used when `source` is "state". */
	rate: Micros;
}

export interface PropertyTaxDerivation {
	tax: PropertyTax | null;
	errors: Partial<Record<ErrorField, string>>;
}

/**
 * Property tax from the raw inputs. A non-empty override wins; clearing it
 * returns to the state rate. With no valid override and no valid price there
 * is nothing to estimate yet (the price field shows its own error).
 */
export const derivePropertyTax = (
	inputs: CalculatorInputs,
): PropertyTaxDerivation => {
	const rate = DEFAULTS.stateTaxRates.value[inputs.state];
	const text = inputs.annualTaxOverride.trim();

	if (text !== "") {
		const parsed = parseMoney(text);
		let message: string | undefined;
		if (!parsed.ok) {
			message =
				parsed.error === "negative"
					? "Annual property tax cannot be negative"
					: "Annual property tax must be a number";
		} else if (parsed.value > MAX_HOME_PRICE) {
			message = "Annual property tax is too large";
		}
		if (!parsed.ok || message) {
			return { tax: null, errors: { annualTaxOverride: message } };
		}
		return {
			tax: build(parsed.value, "manual", inputs.state, rate),
			errors: {},
		};
	}

	const price = parseMoney(inputs.homePrice);
	if (!price.ok || price.value <= 0 || price.value > MAX_HOME_PRICE) {
		return { tax: null, errors: {} };
	}
	return {
		tax: build(annualTaxFor(price.value, rate), "state", inputs.state, rate),
		errors: {},
	};
};

const build = (
	annual: Cents,
	source: PropertyTax["source"],
	state: StateCode,
	rate: Micros,
): PropertyTax => {
	const months = monthlyTaxes(annual);
	return {
		annual,
		monthly: months[0] as Cents,
		lastMonth: months[MONTHS - 1] as Cents,
		source,
		state,
		rate,
	};
};
