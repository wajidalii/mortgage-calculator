import type { Cents, Micros } from "@/types/units";
import { INTEREST_DENOMINATOR } from "./rate";
import { roundHalfUp } from "./rounding";

/** 100 years. Bounds the size of the exact BigInt power below. */
const MAX_PAYMENTS = 1200;

/**
 * Monthly principal and interest for a fixed-rate loan (PRD 8.3):
 * PI = L x r / (1 - (1 + r)^-n), r = rate / 12, rounded half up to cents.
 *
 * Exact integer math. With r = m / D (m = rate in micros, D = 12,000,000) this
 * is L x m x (D + m)^n / (D x ((D + m)^n - D^n)). BigInt keeps the power
 * exact, so the only rounding is the final half-up cent. A float Math.pow
 * would drift by a few ulps and could flip an exact half cent.
 *
 * Rate 0 gives L / n. Loan 0 gives 0.
 */
export const monthlyPayment = (
	loan: Cents,
	rate: Micros,
	payments: number,
): Cents => {
	if (!Number.isSafeInteger(loan) || loan < 0) {
		throw new RangeError("loan must be a non-negative integer number of cents");
	}
	if (!Number.isSafeInteger(rate) || rate < 0) {
		throw new RangeError("rate must be a non-negative integer in millionths");
	}
	if (!Number.isInteger(payments) || payments < 1 || payments > MAX_PAYMENTS) {
		throw new RangeError(
			`payments must be an integer from 1 to ${MAX_PAYMENTS}`,
		);
	}
	if (loan === 0) return 0 as Cents;
	if (rate === 0) return roundHalfUp(loan, payments) as Cents;

	const den = BigInt(INTEREST_DENOMINATOR);
	const growth = den + BigInt(rate);
	const n = BigInt(payments);
	const growthPow = growth ** n;
	const numerator = BigInt(loan) * BigInt(rate) * growthPow;
	const denominator = den * (growthPow - den ** n);
	// Integer half-up: floor((2 x num + den) / (2 x den)).
	const rounded = (2n * numerator + denominator) / (2n * denominator);
	return Number(rounded) as Cents;
};
