import type { Cents, Micros } from "@/types/units";
import { monthlyPayment } from "./payment";
import { monthlyInterest } from "./rate";

export interface ScheduleRow {
	/** 1-based payment number. */
	month: number;
	/** Total paid this month: regular payment plus extra. */
	payment: Cents;
	interest: Cents;
	/** Scheduled principal, not counting `extra`. */
	principal: Cents;
	/** Extra principal paid this month. */
	extra: Cents;
	/** Balance after this month's payment. */
	balance: Cents;
}

export interface YearRow {
	/** 1-based loan year. */
	year: number;
	payment: Cents;
	interest: Cents;
	principal: Cents;
	extra: Cents;
	/** Balance at the end of the year (the last month's balance). */
	balance: Cents;
}

export interface ScheduleInput {
	loan: Cents;
	rate: Micros;
	/** Number of scheduled payments, years x 12. */
	payments: number;
	/**
	 * Optional extra principal for a month (PRD 8.4 step 4). Default none.
	 * Negative values count as 0; the amount is capped at the remaining balance.
	 */
	extra?: (month: number) => number;
}

export interface LedgerMonth {
	interest: Cents;
	/** Regular payment before extra: min(PI, B + interest), or all of it in the last month. */
	regular: Cents;
	principal: Cents;
	extraPaid: Cents;
	/** Balance after this month's payment. */
	balance: Cents;
}

/**
 * One month of the ledger (PRD 8.4), shared by the fixed-rate and ARM
 * schedules so both follow the same rounding and final-payment policy:
 *   interest = round(B x r)                 (integer half-up)
 *   payment  = min(PI, B + interest)        (all of B + interest in the last month)
 *   principal = max(0, min(B, payment - interest))
 *   extra    = min(max(0, requested), B - principal)
 */
export const ledgerMonth = (
	balance: Cents,
	rate: Micros,
	pi: Cents,
	isLastMonth: boolean,
	requestedExtra = 0,
): LedgerMonth => {
	const interest = monthlyInterest(balance, rate);
	const due = (balance + interest) as Cents;
	const regular = isLastMonth ? due : (Math.min(pi, due) as Cents);
	const principal = Math.max(0, Math.min(balance, regular - interest)) as Cents;
	const requested = Math.max(0, Math.floor(requestedExtra));
	const extraPaid = Math.min(requested, balance - principal) as Cents;
	return {
		interest,
		regular,
		principal,
		extraPaid,
		balance: (balance - principal - extraPaid) as Cents,
	};
};

/**
 * Month-by-month fixed-rate ledger (PRD 8.4), integer cents throughout; see
 * `ledgerMonth` for the monthly rules.
 * The last scheduled month pays off whatever is left, so the final payment can
 * differ from PI by a few dollars. Escrow items (tax, insurance, PMI, HOA) are
 * not inputs here and so can never reduce the balance.
 * The schedule ends early if extra payments clear the balance.
 */
export const buildSchedule = ({
	loan,
	rate,
	payments,
	extra,
}: ScheduleInput): ScheduleRow[] => {
	const pi = monthlyPayment(loan, rate, payments);
	const rows: ScheduleRow[] = [];
	let balance = loan;

	for (let month = 1; month <= payments && balance > 0; month++) {
		const step = ledgerMonth(
			balance,
			rate,
			pi,
			month === payments,
			extra?.(month) ?? 0,
		);
		balance = step.balance;
		rows.push({
			month,
			payment: (step.regular + step.extraPaid) as Cents,
			interest: step.interest,
			principal: step.principal,
			extra: step.extraPaid,
			balance,
		});
	}
	return rows;
};

/** Sum of ledger interest. This is the displayed lifetime interest. */
export const lifetimeInterest = (rows: readonly ScheduleRow[]): Cents =>
	rows.reduce((sum, row) => sum + row.interest, 0) as Cents;

/** Groups the monthly ledger into loan years; each row is the sum of its months. */
export const summarizeByYear = (rows: readonly ScheduleRow[]): YearRow[] => {
	const years: YearRow[] = [];
	for (const row of rows) {
		const year = Math.ceil(row.month / 12);
		const current = years[year - 1];
		if (current) {
			current.payment = (current.payment + row.payment) as Cents;
			current.interest = (current.interest + row.interest) as Cents;
			current.principal = (current.principal + row.principal) as Cents;
			current.extra = (current.extra + row.extra) as Cents;
			current.balance = row.balance;
		} else {
			years.push({
				year,
				payment: row.payment,
				interest: row.interest,
				principal: row.principal,
				extra: row.extra,
				balance: row.balance,
			});
		}
	}
	return years;
};
