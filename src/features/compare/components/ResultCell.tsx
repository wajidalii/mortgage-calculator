import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { Cents } from "@/types/units";
import type { MetricId, ScenarioResult, ScenarioSummary } from "../compare";
import { LOAN_STYLE } from "../loanStyle";

export type ResultSection = "monthly" | "upfront" | "lifetime";

interface ResultCellProps {
	section: ResultSection;
	index: 0 | 1;
	result: ScenarioResult;
	/** True when this loan has the lower value for the metric. */
	isLower: (metric: MetricId) => boolean;
}

/** The PRD 8.5 label. Text, so it never relies on color alone. */
const HypotheticalBadge = () => (
	<span className="ml-2 whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-950 ring-1 ring-amber-400">
		Hypothetical rate
	</span>
);

interface LineProps {
	label: React.ReactNode;
	value: React.ReactNode;
	strong?: boolean;
	lower?: boolean;
	index: 0 | 1;
}

const Line = ({
	label,
	value,
	strong = false,
	lower = false,
	index,
}: LineProps) => (
	<div
		className={cn(
			"flex items-baseline justify-between gap-3 py-1.5",
			strong && "mt-1 border-t border-slate-200 pt-2.5",
		)}
	>
		<dt
			className={cn(
				"text-sm",
				strong ? "font-semibold text-slate-900" : "text-slate-700",
			)}
		>
			{label}
		</dt>
		<dd
			className={cn(
				"text-right tabular-nums",
				strong
					? "text-base font-bold text-slate-900"
					: "text-sm font-medium text-slate-900",
			)}
		>
			{lower ? (
				<span
					className={cn(
						"mr-2 rounded px-1.5 py-0.5 text-xs font-semibold ring-1",
						LOAN_STYLE[index].soft,
					)}
				>
					Lower
				</span>
			) : null}
			{value}
		</dd>
	</div>
);

const money = (amount: Cents | null | undefined): string =>
	amount === null || amount === undefined ? "—" : formatMoney(amount);

const lineAmount = (
	summary: ScenarioSummary | null,
	id: string,
): Cents | null =>
	summary?.estimate?.lender.find((line) => line.id === id)?.amount ?? null;

const ResultCell = ({ section, index, result, isLower }: ResultCellProps) => {
	const s = result.summary;
	if (!s) {
		return (
			<p className="text-sm text-slate-700">
				Fix the highlighted fields to see this loan's results.
			</p>
		);
	}
	if (section === "monthly") {
		const pmiLine = lineAmount(s, "pmi");
		return (
			<dl>
				<Line
					index={index}
					label={
						<>
							{s.isArm
								? "Principal and interest (months 1–60)"
								: "Principal and interest"}
							{s.isArm ? <HypotheticalBadge /> : null}
						</>
					}
					value={money(s.payment)}
					lower={isLower("payment")}
				/>
				<Line
					index={index}
					label="Property tax"
					value={money(lineAmount(s, "tax"))}
				/>
				<Line
					index={index}
					label="Homeowners insurance"
					value={money(lineAmount(s, "insurance"))}
				/>
				<Line
					index={index}
					label="PMI"
					value={pmiLine === null ? "Not required" : money(pmiLine)}
				/>
				<Line
					index={index}
					label="Highest payment (assumed index)"
					value={s.peakPayment ? money(s.peakPayment) : "No reset"}
				/>
				<Line
					index={index}
					strong
					label="Total monthly cost"
					value={money(s.estimate?.total)}
					lower={isLower("total")}
				/>
			</dl>
		);
	}
	if (section === "upfront") {
		return (
			<>
				<dl>
					<Line
						index={index}
						label="Loan amount"
						value={money(s.loan.loanAmount)}
						lower={isLower("loanAmount")}
					/>
					<Line
						index={index}
						label="Down payment"
						value={money(s.loan.downPayment)}
					/>
					<Line
						index={index}
						label="Loan to value"
						value={formatPercent(s.loan.ltv)}
					/>
					<Line
						index={index}
						strong
						label="Cash to close"
						value={money(s.cashToClose)}
						lower={isLower("cashToClose")}
					/>
				</dl>
				<p className="mt-2 text-xs text-slate-600">
					Down payment only. Closing costs are not estimated here.
				</p>
			</>
		);
	}
	return (
		<dl>
			<Line
				index={index}
				strong
				label="Lifetime interest"
				value={money(s.lifetimeInterest)}
				lower={isLower("lifetimeInterest")}
			/>
			<Line
				index={index}
				label="Total principal and interest paid"
				value={money((s.loan.loanAmount + s.lifetimeInterest) as Cents)}
			/>
			{s.isArm ? (
				<p className="mt-2 text-xs text-slate-600">
					ARM interest uses an index path we assumed after month 60. The real
					rate may be higher or lower.
				</p>
			) : null}
		</dl>
	);
};

export default ResultCell;
