import { roundHalfUp } from "./rounding";

export type ParseError = "empty" | "invalid" | "negative" | "too-large";

export type ParseResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: ParseError };

const NUMBER_PATTERN = /^(-?)(\d*)(?:\.(\d*))?$/;

/**
 * Parses non-negative decimal text into an integer scaled by 10^decimals.
 * Splits at the decimal point and pads the fraction with zeros. If there are
 * more fraction digits than `decimals`, rounds half up with roundHalfUp.
 * Never uses parseFloat, multiplication by a float, or toFixed.
 * Thousands commas are ignored.
 */
export const parseScaled = (
	text: string,
	decimals: number,
): ParseResult<number> => {
	const cleaned = text.trim().replaceAll(",", "");
	if (cleaned === "") return { ok: false, error: "empty" };
	const match = NUMBER_PATTERN.exec(cleaned);
	if (!match) return { ok: false, error: "invalid" };
	const [, sign, whole = "", fraction = ""] = match;
	if (whole === "" && fraction === "") return { ok: false, error: "invalid" };
	if (sign === "-") return { ok: false, error: "negative" };
	// Keep one extra digit; for half-up only that digit decides the rounding.
	const extended = fraction.slice(0, decimals + 1).padEnd(decimals + 1, "0");
	const scaledByTen = Number(`${whole === "" ? "0" : whole}${extended}`);
	if (!Number.isSafeInteger(scaledByTen)) {
		return { ok: false, error: "too-large" };
	}
	return { ok: true, value: roundHalfUp(scaledByTen, 10) };
};
