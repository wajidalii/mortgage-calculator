/**
 * The single rounding helper. Integer half-up division for a non-negative
 * integer numerator: floor((2n + d) / (2d)). No float rounding is involved.
 * Throws RangeError if any intermediate value leaves the safe integer range.
 */
export const roundHalfUp = (numerator: number, denominator: number): number => {
	if (
		!Number.isSafeInteger(numerator) ||
		!Number.isSafeInteger(denominator) ||
		numerator < 0 ||
		denominator <= 0
	) {
		throw new RangeError(
			"roundHalfUp needs a non-negative integer numerator and a positive integer denominator",
		);
	}
	const doubled = numerator * 2 + denominator;
	if (
		!Number.isSafeInteger(doubled) ||
		!Number.isSafeInteger(2 * denominator)
	) {
		throw new RangeError("roundHalfUp overflowed the safe integer range");
	}
	return Math.floor(doubled / (2 * denominator));
};
