import type { Cents, Micros } from "../types/units";
import { type ParseResult, parseScaled } from "./decimal";
import { roundHalfUp } from "./rounding";

/** Monthly interest denominator: 12 months x 1,000,000 micros. */
export const INTEREST_DENOMINATOR = 12_000_000;

/**
 * Parse percent text ("6.125", "6.125%") into integer millionths (61250).
 * 1% is 10,000 micros, so four percent decimals are exact; more are rounded
 * half up.
 */
export const parseRate = (text: string): ParseResult<Micros> => {
	const trimmed = text.trim();
	const result = parseScaled(
		trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed,
		4,
	);
	return result.ok ? { ok: true, value: result.value as Micros } : result;
};

/**
 * Overflow policy: REJECT (no BigInt). The interest line computes
 * balance x micro x 2 + den, which must stay at or below
 * Number.MAX_SAFE_INTEGER (9,007,199,254,740,991). With a 12% rate this
 * allows balances of roughly $375 million, far above any real loan.
 */
export const isInterestSafe = (balance: Cents, rate: Micros): boolean =>
	Number.isSafeInteger(balance * rate * 2 + INTEREST_DENOMINATOR);

/**
 * Monthly interest in cents, integer half-up:
 * floor((B x micro x 2 + den) / (2 x den)). Throws RangeError when
 * isInterestSafe is false.
 */
export const monthlyInterest = (balance: Cents, rate: Micros): Cents => {
	if (!isInterestSafe(balance, rate)) {
		throw new RangeError("balance x rate exceeds the safe integer range");
	}
	return roundHalfUp(balance * rate, INTEREST_DENOMINATOR) as Cents;
};

/** Micros to percent text with 0 to 4 fixed decimals, rounded half up. 61250, 2 -> "6.13%". */
export const formatPercent = (rate: Micros, decimals = 2): string => {
	if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) {
		throw new RangeError("decimals must be an integer from 0 to 4");
	}
	const scaled = roundHalfUp(rate, 10 ** (4 - decimals));
	const text = String(scaled).padStart(decimals + 1, "0");
	const whole = decimals === 0 ? text : text.slice(0, -decimals);
	const fraction = decimals === 0 ? "" : `.${text.slice(-decimals)}`;
	return `${whole}${fraction}%`;
};

/** Micros to percent text without losing precision, minimum 2 decimals. 61250 -> "6.125%". */
export const formatRate = (rate: Micros): string => {
	const four = formatPercent(rate, 4).slice(0, -1);
	const trimmed = four.replace(/0{1,2}$/, "");
	return `${trimmed}%`;
};
