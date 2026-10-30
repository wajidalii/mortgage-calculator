import type { Cents } from "../types/units";
import { type ParseResult, parseScaled } from "./decimal";

/**
 * Parse dollar text ("1,234.50", "$19.99") into integer cents. Extra decimals
 * are rounded half up, so "1.005" is 101 cents. Empty text returns the
 * explicit "empty" error; negatives return "negative".
 */
export const parseMoney = (text: string): ParseResult<Cents> => {
	const trimmed = text.trim();
	const result = parseScaled(
		trimmed.startsWith("$") ? trimmed.slice(1) : trimmed,
		2,
	);
	return result.ok ? { ok: true, value: result.value as Cents } : result;
};

/**
 * Integer cents to "$1,234.56", or "-$1,234.56" for negatives. Uses integer
 * math on the absolute value. Throws RangeError for non-integer input.
 */
export const formatMoney = (cents: Cents): string => {
	if (!Number.isSafeInteger(cents)) {
		throw new RangeError("formatMoney needs an integer number of cents");
	}
	const magnitude = Math.abs(cents);
	const dollars = Math.floor(magnitude / 100);
	const rest = magnitude - dollars * 100;
	const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const sign = cents < 0 ? "-" : "";
	return `${sign}$${grouped}.${String(rest).padStart(2, "0")}`;
};
