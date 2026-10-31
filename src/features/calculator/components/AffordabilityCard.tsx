import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import {
	type Affordability,
	type DtiRatio,
	NOT_A_LOAN_APPROVAL,
} from "../affordability";

interface AffordabilityCardProps {
	affordability: Affordability | null;
}

const RatioRow = ({
	label,
	formula,
	dti,
}: {
	label: string;
	formula: string;
	dti: DtiRatio;
}) => (
	<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
		<dt className="text-slate-700">
			{label}
			<span className="block text-xs text-slate-600">
				{formula}. Guideline {formatPercent(dti.threshold, 1)}
			</span>
		</dt>
		<dd className="flex items-center gap-2">
			<span className="text-2xl font-bold text-slate-900">
				{formatPercent(dti.ratio, 1)}
			</span>
			{dti.above ? (
				<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-400">
					<span aria-hidden="true">⚠ </span>Above guideline
				</span>
			) : null}
		</dd>
	</div>
);

const AffordabilityCard = ({ affordability }: AffordabilityCardProps) => (
	<section
		aria-labelledby="affordability-heading"
		className="rounded-lg bg-white p-4 ring-1 ring-slate-300 sm:p-6"
	>
		<h2
			id="affordability-heading"
			className="text-sm font-medium text-slate-700"
		>
			Simplified affordability
		</h2>
		<div aria-live="polite">
			{affordability ? (
				<dl className="mt-2 divide-y divide-slate-100 text-sm">
					<RatioRow
						label="Front-end ratio"
						formula="Housing payment / income"
						dti={affordability.frontEnd}
					/>
					<RatioRow
						label="Back-end ratio"
						formula="Housing payment + other debt / income"
						dti={affordability.backEnd}
					/>
					<div className="py-2 text-xs text-slate-600">
						Housing payment {formatMoney(affordability.housing)} (lender payment
						plus HOA), income {formatMoney(affordability.income)}.
					</div>
				</dl>
			) : (
				<p className="mt-1 text-base text-slate-700">
					Enter your gross monthly income and fix any highlighted fields to see
					your ratios.
				</p>
			)}
		</div>
		<p className="mt-3 text-sm font-medium text-slate-800">
			{NOT_A_LOAN_APPROVAL}
		</p>
	</section>
);

export default AffordabilityCard;
