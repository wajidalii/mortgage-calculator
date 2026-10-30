import { DEFAULTS } from "@/config/defaults/defaults";
import type { ScheduleRow } from "@/lib/amortization";
import { monthlyInterest, parseRate } from "@/lib/rate";
import type { Cents, Micros } from "@/types/units";
import type { CalculatorInputs, ErrorField, LoanDerivation } from "./types";

/** PMI is required above this loan-to-value, as a whole percent. */
const PMI_LTV_PERCENT = 80;
/** PMI ends when the scheduled balance is at or below this share of the price. */
const PMI_END_PERCENT = 78;
const MAX_PMI_RATE = 1_000_000;

/** LTV > 80%, compared exactly in integers: loan x 100 > price x 80. */
export const isPmiRequired = (loan: Cents, price: Cents): boolean =>
	loan * 100 > price * PMI_LTV_PERCENT;

/**
 * monthlyPMI = round(L x annualPmiRate / 12) (PRD 8.8), level on the original
 * loan. It is the same integer half-up expression as a month of interest.
 */
export const monthlyPmi = (loan: Cents, annualRate: Micros): Cents =>
	monthlyInterest(loan, annualRate);

/**
 * First month whose balance (after that month's payment) is at or below
 * `percent` of the price, or null. Integer compare: balance x 100 <= price x pct.
 */
export const firstMonthAtOrBelow = (
	rows: readonly ScheduleRow[],
	price: Cents,
	percent: number,
): number | null =>
	rows.find((row) => row.balance * 100 <= price * percent)?.month ?? null;

export interface Pmi {
	monthly: Cents;
	/** Annual rate used. */
	rate: Micros;
	rateIsDefault: boolean;
	/** First month the scheduled balance is at or below 78% of the price. */
	endsMonth: number;
	/** First month the scheduled balance is at or below 80% of the price. */
	removalMonth: number;
}

export type PmiResult =
	| { status: "not-required" }
	| { status: "turned-off" }
	| { status: "on"; pmi: Pmi };

export interface PmiDerivation {
	/** True when LTV is above 80%, so the PMI controls apply. */
	required: boolean;
	/** Null while the loan or PMI rate is not valid. */
	result: PmiResult | null;
	errors: Partial<Record<ErrorField, string>>;
}

/**
 * PMI estimate (PRD 8.8). `schedule` must be the original schedule with no
 * extra payments: the 78% month never moves with extra payments.
 */
export const derivePmi = (
	inputs: CalculatorInputs,
	loan: LoanDerivation | null,
	schedule: readonly ScheduleRow[] | null,
): PmiDerivation => {
	if (!loan || !schedule) return { required: false, result: null, errors: {} };
	const required = isPmiRequired(loan.loanAmount, loan.homePrice);
	if (!required) {
		return { required, result: { status: "not-required" }, errors: {} };
	}
	if (!inputs.pmiOn) {
		return { required, result: { status: "turned-off" }, errors: {} };
	}

	const text = inputs.pmiRate.trim();
	let rate = DEFAULTS.pmiRate.value;
	if (text !== "") {
		const parsed = parseRate(text);
		if (!parsed.ok) {
			const message =
				parsed.error === "negative"
					? "PMI rate cannot be negative"
					: "PMI rate must be a number";
			return { required, result: null, errors: { pmiRate: message } };
		}
		if (parsed.value > MAX_PMI_RATE) {
			return {
				required,
				result: null,
				errors: { pmiRate: "PMI rate cannot be more than 100%" },
			};
		}
		rate = parsed.value;
	}

	// The balance reaches 0, so both months exist for any valid schedule.
	const endsMonth = firstMonthAtOrBelow(
		schedule,
		loan.homePrice,
		PMI_END_PERCENT,
	);
	const removalMonth = firstMonthAtOrBelow(
		schedule,
		loan.homePrice,
		PMI_LTV_PERCENT,
	);
	if (endsMonth === null || removalMonth === null) {
		return { required, result: null, errors: {} };
	}
	return {
		required,
		result: {
			status: "on",
			pmi: {
				monthly: monthlyPmi(loan.loanAmount, rate),
				rate,
				rateIsDefault: text === "",
				endsMonth,
				removalMonth,
			},
		},
		errors: {},
	};
};
