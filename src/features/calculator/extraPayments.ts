import {
	buildSchedule,
	lifetimeInterest,
	type ScheduleRow,
} from "@/lib/amortization";
import { parseMoney } from "@/lib/money";
import type { Cents } from "@/types/units";
import { MAX_HOME_PRICE } from "./loanMath";
import type { CalculatorInputs, ErrorField, LoanDerivation } from "./types";
import { parseMessage } from "./validation";

/** The schedule with the user's extra payments, compared to the base one. */
export interface ExtraPayments {
	rows: ScheduleRow[];
	/** Month of the last payment. */
	payoffMonth: number;
	/** Base payment count minus the payoff month. */
	monthsSaved: number;
	interestSaved: Cents;
	totalInterest: Cents;
}

export interface ExtraDerivation {
	errors: Partial<Record<ErrorField, string>>;
	/** Null when no extra is entered, an input is invalid or the loan is an ARM. */
	result: ExtraPayments | null;
}

const NONE: ExtraDerivation = { errors: {}, result: null };

/** Blank is $0. */
const parseOptional = (
	text: string,
	label: string,
): { value: Cents } | { error: string } => {
	if (text.trim() === "") return { value: 0 as Cents };
	const parsed = parseMoney(text);
	if (!parsed.ok) return { error: parseMessage(label, parsed.error) };
	if (parsed.value > MAX_HOME_PRICE) return { error: `${label} is too large` };
	return { value: parsed.value };
};

/**
 * Extra payments (PRD 8.4 step 4): a recurring monthly amount from month 1 and
 * an optional one-time lump sum in a chosen month, both applied to principal
 * through the ledger's `extra` hook. Fixed-rate loans only: the ARM schedule
 * has no extra hook. `base` is the schedule without extras.
 */
export const deriveExtraPayments = (
	inputs: CalculatorInputs,
	loan: LoanDerivation | null,
	base: readonly ScheduleRow[] | null,
): ExtraDerivation => {
	const errors: ExtraDerivation["errors"] = {};

	const monthly = parseOptional(inputs.extraMonthly, "extra payment");
	if ("error" in monthly) errors.extraMonthly = monthly.error;
	const lump = parseOptional(inputs.lumpSum, "lump sum");
	if ("error" in lump) errors.lumpSum = lump.error;

	const payments = loan ? loan.termYears * 12 : 0;
	let lumpMonth = 0;
	if (!("error" in lump) && lump.value > 0) {
		const text = inputs.lumpMonth.trim();
		const whole = /^\d{1,6}$/.test(text);
		const value = whole ? Number(text) : 0;
		if (text === "") {
			errors.lumpMonth = "Enter the month of the lump sum";
		} else if (!whole || value < 1 || (loan && value > payments)) {
			errors.lumpMonth = loan
				? `Month must be a whole number from 1 to ${payments}`
				: "Month must be a whole number";
		} else {
			lumpMonth = value;
		}
	}

	if (
		inputs.loanType === "arm" ||
		!loan ||
		!base ||
		Object.keys(errors).length > 0
	) {
		return { errors, result: null };
	}
	const monthlyExtra = "value" in monthly ? monthly.value : 0;
	const lumpExtra = "value" in lump ? lump.value : 0;
	if (monthlyExtra === 0 && lumpExtra === 0) return NONE;

	const rows = buildSchedule({
		loan: loan.loanAmount,
		rate: loan.interestRate,
		payments,
		extra: (month) => monthlyExtra + (month === lumpMonth ? lumpExtra : 0),
	});
	const totalInterest = lifetimeInterest(rows);
	return {
		errors,
		result: {
			rows,
			payoffMonth: rows.length,
			monthsSaved: base.length - rows.length,
			interestSaved: (lifetimeInterest(base) - totalInterest) as Cents,
			totalInterest,
		},
	};
};
