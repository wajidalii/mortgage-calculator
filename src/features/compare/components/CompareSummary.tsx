import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import type { Cents } from "@/types/units";
import {
	buildCompareNotes,
	buildMetrics,
	type CompareState,
	type Comparison,
	type Metric,
} from "../compare";
import { LOAN_LABELS, LOAN_STYLE } from "../loanStyle";

interface CompareSummaryProps {
	state: CompareState;
	comparison: Comparison;
}

const SUMMARY_IDS = ["total", "payment", "lifetimeInterest", "cashToClose"];

const money = (cents: Cents | null): string =>
	cents === null ? "—" : formatMoney(cents);

/** One plain sentence. States the gap; never says which loan is better. */
const gapText = (metric: Metric): string => {
	if (metric.difference === null) return "Needs two valid loans";
	if (metric.lower === null) return "Same for both";
	return `${LOAN_LABELS[metric.lower]} is ${formatMoney(metric.difference)} lower`;
};

const CompareSummary = ({ state, comparison }: CompareSummaryProps) => {
	const metrics = buildMetrics(comparison).filter((metric) =>
		SUMMARY_IDS.includes(metric.id),
	);
	const notes = buildCompareNotes(state, comparison);
	return (
		<section
			aria-labelledby="compare-summary-heading"
			className="rounded-2xl bg-white p-4 shadow-panel ring-1 ring-slate-200 sm:p-6"
		>
			<h2
				id="compare-summary-heading"
				className="text-xs font-bold tracking-widest text-brand-700 uppercase"
			>
				Differences at a glance
			</h2>
			<dl
				aria-live="polite"
				className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
			>
				{metrics.map((metric) => (
					<div
						key={metric.id}
						className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
					>
						<dt className="text-xs font-semibold text-slate-700">
							{metric.label}
						</dt>
						<dd className="mt-1 text-sm font-bold text-slate-900">
							{gapText(metric)}
						</dd>
						<dd className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-600 tabular-nums">
							{([0, 1] as const).map((index) => (
								<span
									key={LOAN_LABELS[index]}
									className="flex items-center gap-1.5"
								>
									<span
										aria-hidden="true"
										className={cn(
											"size-2 rounded-full",
											LOAN_STYLE[index].badge,
										)}
									/>
									{index === 0 ? "A" : "B"} {money(metric.values[index])}
								</span>
							))}
						</dd>
					</div>
				))}
			</dl>
			<ul className="mt-4 grid gap-2 text-sm text-slate-700">
				{notes.map((note) => (
					<li key={note.id} className="flex items-start gap-2">
						<span
							className={cn(
								"mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ring-1",
								note.tone === "differs"
									? "bg-amber-100 text-amber-950 ring-amber-400"
									: "bg-slate-100 text-slate-800 ring-slate-300",
							)}
						>
							{note.tone === "differs" ? "Differs" : "Shared"}
						</span>
						<span>{note.text}</span>
					</li>
				))}
			</ul>
		</section>
	);
};

export default CompareSummary;
