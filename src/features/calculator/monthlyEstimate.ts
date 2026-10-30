import type { Cents } from "@/types/units";
import type { MonthlyCosts } from "./monthlyCosts";
import type { PmiResult } from "./pmi";
import type { PropertyTax } from "./propertyTax";
import type { LoanDerivation } from "./types";

export interface EstimateLine {
	id: "pi" | "tax" | "insurance" | "pmi" | "hoa" | "other";
	label: string;
	amount: Cents;
}

/** One itemized monthly estimate (PRD 8.9). */
export interface MonthlyEstimate {
	/** Lender payment (escrow) lines: P&I, tax, insurance and PMI when on. */
	lender: EstimateLine[];
	lenderPayment: Cents;
	/** Non-escrow lines: HOA and other monthly costs. */
	nonEscrow: EstimateLine[];
	nonEscrowTotal: Cents;
	total: Cents;
}

const sum = (lines: readonly EstimateLine[]): Cents =>
	lines.reduce((total, line) => total + line.amount, 0) as Cents;

/**
 * Builds the itemized estimate from already-rounded cent line items, so the
 * subtotals and the total are exact sums of the lines shown. Returns null
 * until every part is valid. Tax uses the regular monthly amount (months 1 to
 * 11); month 12 can differ by a few cents and is shown with the tax detail.
 */
export const buildMonthlyEstimate = (
	loan: LoanDerivation | null,
	tax: PropertyTax | null,
	costs: MonthlyCosts | null,
	pmi: PmiResult | null,
): MonthlyEstimate | null => {
	if (!loan || !tax || !costs || !pmi) return null;

	const lender: EstimateLine[] = [
		{
			id: "pi",
			label: "Principal and interest",
			amount: loan.monthlyPrincipalAndInterest,
		},
		{ id: "tax", label: "Property tax", amount: tax.monthly },
		{
			id: "insurance",
			label: "Homeowners insurance",
			amount: costs.monthlyInsurance,
		},
	];
	if (pmi.status === "on") {
		lender.push({ id: "pmi", label: "PMI", amount: pmi.pmi.monthly });
	}
	const nonEscrow: EstimateLine[] = [
		{ id: "hoa", label: "HOA", amount: costs.monthlyHoa },
		{ id: "other", label: "Other monthly cost", amount: costs.monthlyOther },
	];

	const lenderPayment = sum(lender);
	const nonEscrowTotal = sum(nonEscrow);
	return {
		lender,
		lenderPayment,
		nonEscrow,
		nonEscrowTotal,
		total: (lenderPayment + nonEscrowTotal) as Cents,
	};
};
