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

/** Whole number to text with thousands commas: 1234567 -> "1,234,567". */
export const groupThousands = (whole: number): string =>
	String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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
	const sign = cents < 0 ? "-" : "";
	return `${sign}$${groupThousands(dollars)}.${String(rest).padStart(2, "0")}`;
};

/**
 * Short label for chart axes and captions, such as "$400k" or "$1.2M". Rounds
 * for display only; never use it for a figure the user reads as exact.
 */
export const formatCompactMoney = (cents: number): string => {
	const dollars = Math.round(cents / 100);
	if (dollars >= 1_000_000) {
		return `$${Math.round(dollars / 100_000) / 10}M`;
	}
	if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}k`;
	return `$${dollars}`;
};
