import type { ReactNode } from "react";
import { lifetimeInterest, type ScheduleRow } from "@/lib/amortization";
import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { ClosingCosts } from "../closingCosts";
import type { LoanDerivation } from "../types";

interface LoanMetricsProps {
	loan: LoanDerivation | null;
	closing: ClosingCosts | null;
	/** The schedule the table shows (with extra payments when there are any). */
	rows: readonly ScheduleRow[] | null;
	isArm: boolean;
}

const Metric = ({
	label,
	value,
	note,
	className,
}: {
	label: string;
	value: string;
	note: ReactNode;
	className?: string;
}) => (
	<div
		className={`rounded-xl bg-white p-4 ring-1 ring-slate-200 ${className ?? ""}`}
	>
		<dt className="text-xs font-semibold text-slate-600">{label}</dt>
		<dd className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 tabular-nums">
			{value}
		</dd>
		<dd className="mt-0.5 text-xs text-slate-600">{note}</dd>
	</div>
);

const interestNote = (rows: readonly ScheduleRow[], isArm: boolean): string => {
	if (rows.some((row) => row.extra > 0)) return "With your extra payments";
	if (isArm) return "Uses hypothetical rates after month 60";
	return `Over ${rows.length} payments`;
};

/** Loan amount and LTV, cash to close and lifetime interest, each shown once. */
const LoanMetrics = ({ loan, closing, rows, isArm }: LoanMetricsProps) => (
	<section aria-labelledby="loan-summary-heading">
		<h2 id="loan-summary-heading" className="sr-only">
			Loan summary
		</h2>
		<div aria-live="polite">
			{loan ? (
				<dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					<Metric
						label="Loan amount"
						value={formatMoney(loan.loanAmount)}
						note={
							<>
								<span>{formatPercent(loan.ltv, 2)}</span> loan-to-value (LTV)
								<span className="block">
									{formatPercent(loan.downPaymentPercent, 2)} down
								</span>
							</>
						}
					/>
					<Metric
						label="Cash to close"
						value={closing ? formatMoney(closing.cashToClose) : "Not available"}
						note={
							closing
								? "Down payment plus closing costs, minus credits"
								: "Fix the closing cost fields"
						}
					/>
					{rows ? (
						<Metric
							className="col-span-2 sm:col-span-1"
							label="Lifetime interest"
							value={formatMoney(lifetimeInterest(rows))}
							note={interestNote(rows, isArm)}
						/>
					) : null}
				</dl>
			) : (
				<p className="rounded-xl bg-white p-4 text-base text-slate-700 ring-1 ring-slate-200">
					Fix the highlighted fields to see the loan amount, LTV and cash to
					close.
				</p>
			)}
		</div>
	</section>
);

export default LoanMetrics;
