import { monthlyPayment } from "@/lib/payment";
import type { Cents, Micros } from "@/types/units";
import type { LoanDerivation } from "./types";
import { MAX_INTEREST_RATE } from "./validation";

/** Distance between rows: 0.50 percentage points, in millionths. */
export const RATE_STEP: Micros = 5000 as Micros;

/** Rows shown around the base rate, in steps: -1.00, -0.50, 0, +0.50, +1.00. */
export const RATE_STEPS = [-2, -1, 0, 1, 2] as const;

export interface SensitivityRow {
	rate: Micros;
	payment: Cents;
	/** Payment minus the base-rate payment. */
	difference: Cents;
	isBase: boolean;
}

/**
 * Monthly principal and interest for the same loan and term at rates around
 * the base rate. Rows below 0% or above the 30% input limit are left out.
 */
export const buildRateSensitivity = (
	loan: LoanDerivation,
): SensitivityRow[] => {
	const payments = loan.termYears * 12;
	const base = monthlyPayment(loan.loanAmount, loan.interestRate, payments);
	const rows: SensitivityRow[] = [];
	for (const step of RATE_STEPS) {
		const rate = loan.interestRate + step * RATE_STEP;
		if (rate < 0 || rate > MAX_INTEREST_RATE) continue;
		const payment = monthlyPayment(loan.loanAmount, rate as Micros, payments);
		rows.push({
			rate: rate as Micros,
			payment,
			difference: (payment - base) as Cents,
			isBase: step === 0,
		});
	}
	return rows;
};
