import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { Cents } from "@/types/units";
import type { ClosingCosts } from "../closingCosts";
import type { LoanDerivation } from "../types";
import CashToCloseCard from "./CashToCloseCard";

interface LoanMetricsProps {
	loan: LoanDerivation | null;
	closing: ClosingCosts | null;
	/** Interest over the whole schedule, or null when there is none to show. */
	lifetimeInterest: Cents | null;
	/** The schedule is an ARM's, so later rows use hypothetical rates. */
	isArm: boolean;
}

const Stat = ({
	label,
	value,
	note,
}: {
	label: string;
	value: string;
	note: string;
}) => (
	<div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
		<dt className="text-xs font-medium text-slate-600">{label}</dt>
		<dd className="mt-1.5 text-xl font-bold tracking-tight tabular-nums text-slate-900">
			{value}
		</dd>
		<dd className="mt-0.5 text-xs text-slate-600">{note}</dd>
	</div>
);

const LoanMetrics = ({
	loan,
	closing,
	lifetimeInterest,
	isArm,
}: LoanMetricsProps) => (
	<section aria-labelledby="loan-metrics-heading">
		<h2 id="loan-metrics-heading" className="sr-only">
			Loan summary
		</h2>
		<div aria-live="polite">
			{loan ? (
				<dl className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
					<Stat
						label="Loan amount"
						value={formatMoney(loan.loanAmount)}
						note={`${formatPercent(loan.ltv, 2)} loan-to-value`}
					/>
					<Stat
						label="Cash to close"
						value={closing ? formatMoney(closing.cashToClose) : "Not available"}
						note={
							closing
								? "Down payment + closing costs − credits"
								: "Fix the highlighted fields"
						}
					/>
					<Stat
						label="Lifetime interest"
						value={
							lifetimeInterest === null
								? "$0.00"
								: formatMoney(lifetimeInterest)
						}
						note={isArm ? "Includes hypothetical rates" : "Over the full term"}
					/>
				</dl>
			) : (
				<p className="text-sm text-slate-700">
					Fix the highlighted fields to see the loan amount and LTV.
				</p>
			)}
		</div>
		<details className="group mt-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
			<summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 [&::-webkit-details-marker]:hidden">
				Cash to close breakdown
				<span aria-hidden="true" className="text-xl text-brand-700">
					<span className="group-open:hidden">+</span>
					<span className="hidden group-open:inline">−</span>
				</span>
			</summary>
			<div className="mt-2">
				<CashToCloseCard closing={closing} />
			</div>
		</details>
	</section>
);

export default LoanMetrics;
