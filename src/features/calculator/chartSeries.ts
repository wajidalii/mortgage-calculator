import type { ScheduleRow } from "@/lib/amortization";
import type { Cents } from "@/types/units";

export interface ChartPoint {
	/** 0 is the start of the loan. */
	month: number;
	balance: Cents;
	/** Interest paid from month 1 up to this month. */
	interestPaid: Cents;
}

export interface BalanceSeries {
	points: ChartPoint[];
	startBalance: Cents;
	totalInterest: Cents;
	months: number;
	/** First month priced at a hypothetical rate (ARM), if any. */
	hypotheticalFrom: number | null;
}

type ChartRow = ScheduleRow & { hypothetical?: boolean };

/**
 * Reduces the monthly ledger to one point per loan year (plus the start and
 * the last month) for the balance chart. It only reads ledger values, so the
 * chart can never disagree with the amortization table.
 */
export const buildBalanceSeries = (
	rows: readonly ChartRow[],
): BalanceSeries | null => {
	const first = rows[0];
	if (!first) return null;
	const startBalance = (first.balance + first.principal + first.extra) as Cents;
	const points: ChartPoint[] = [
		{ month: 0, balance: startBalance, interestPaid: 0 as Cents },
	];
	let interest = 0;
	rows.forEach((row, index) => {
		interest += row.interest;
		if (row.month % 12 === 0 || index === rows.length - 1) {
			points.push({
				month: row.month,
				balance: row.balance,
				interestPaid: interest as Cents,
			});
		}
	});
	const firstHypothetical = rows.find((row) => row.hypothetical);
	return {
		points,
		startBalance,
		totalInterest: interest as Cents,
		months: rows.length,
		hypotheticalFrom: firstHypothetical ? firstHypothetical.month : null,
	};
};
