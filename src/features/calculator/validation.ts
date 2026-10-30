import type { ParseError } from "@/lib/decimal";
import { parseMoney } from "@/lib/money";
import type { Micros } from "@/types/units";
import type { CalculatorInputs, ErrorField } from "./types";

/** Interest and start rates above 30% are rejected (PRD S-10). */
export const MAX_INTEREST_RATE = 300_000 as Micros;

export const RATE_TOO_HIGH = "Interest rate cannot be more than 30%";
export const DOWN_PAYMENT_TOO_HIGH =
	"Down payment cannot be more than the price";

/**
 * Message for a field that failed to parse. `label` reads after "Enter":
 * "a home price" gives "Enter a home price" and "A home price must be a number".
 */
export const parseMessage = (label: string, error: ParseError): string => {
	const sentence = `${label[0]?.toUpperCase()}${label.slice(1)}`;
	switch (error) {
		case "empty":
			return `Enter ${label}`;
		case "negative":
			return `${sentence} cannot be negative`;
		case "too-large":
			return `${sentence} is too large`;
		default:
			return `${sentence} must be a number`;
	}
};

/** Money text fields and the error field that reports each. */
const MONEY_FIELDS: readonly {
	input: keyof CalculatorInputs;
	error: ErrorField;
}[] = [
	{ input: "homePrice", error: "homePrice" },
	{ input: "downPaymentAmount", error: "downPayment" },
	{ input: "annualTaxOverride", error: "annualTaxOverride" },
	{ input: "annualInsurance", error: "annualInsurance" },
	{ input: "extraAnnualInsurance", error: "extraAnnualInsurance" },
	{ input: "monthlyHoa", error: "monthlyHoa" },
	{ input: "monthlyOther", error: "monthlyOther" },
];

/**
 * Money fields whose text is not a number at all (letters, stray symbols).
 * Blank is not included: a blank required field has no result to keep, and a
 * blank optional field is valid. The dollar down payment counts only while it
 * is the field the user types in.
 */
export const nonNumericMoneyFields = (
	inputs: CalculatorInputs,
): Set<ErrorField> => {
	const bad = new Set<ErrorField>();
	for (const { input, error } of MONEY_FIELDS) {
		if (input === "downPaymentAmount" && inputs.downPaymentMode !== "amount") {
			continue;
		}
		const text = inputs[input];
		if (typeof text !== "string" || text.trim() === "") continue;
		const parsed = parseMoney(text);
		if (!parsed.ok && parsed.error === "invalid") bad.add(error);
	}
	return bad;
};

/**
 * True when every error is non-numeric text in a money field. Then the page
 * keeps the last valid result visible instead of clearing it. Any other error
 * (a rate out of range, a down payment above the price, a blank price) shows
 * no result.
 */
export const keepsLastResult = (
	errors: Partial<Record<ErrorField, string | undefined>>,
	inputs: CalculatorInputs,
): boolean => {
	const failing = Object.entries(errors)
		.filter(([, message]) => message !== undefined)
		.map(([field]) => field as ErrorField);
	if (failing.length === 0) return false;
	const text = nonNumericMoneyFields(inputs);
	return failing.every((field) => text.has(field));
};
