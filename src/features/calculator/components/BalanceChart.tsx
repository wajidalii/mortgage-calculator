import { useId, useMemo } from "react";
import Card from "@/components/ui/Card";
import type { ScheduleRow } from "@/lib/amortization";
import { formatCompactMoney as compactMoney } from "@/lib/money";
import type { Cents } from "@/types/units";

interface BalanceChartProps {
	/** The schedule shown in the table (with extra payments when there are any). */
	rows: readonly ScheduleRow[];
	/** The original schedule, passed only when extra payments change it. */
	baseRows?: readonly ScheduleRow[] | null;
	loanAmount: Cents;
	/** Months after this one use hypothetical ARM rates. */
	hypotheticalAfter?: number | null;
}

const W = 600;
const H = 220;
const TOP = 10;

/** Year-end points from month 0, as [month, balance]. */
const yearPoints = (
	rows: readonly ScheduleRow[],
	loan: number,
): [number, number][] => {
	const points: [number, number][] = [[0, loan]];
	rows.forEach((row, index) => {
		if (row.month % 12 === 0 || index === rows.length - 1) {
			points.push([row.month, row.balance]);
		}
	});
	return points;
};

const toPath = (
	points: readonly [number, number][],
	months: number,
	loan: number,
): string =>
	points
		.map(([month, balance], index) => {
			const x = (month / months) * W;
			const y = H - (balance / loan) * (H - TOP);
			return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
		})
		.join(" ");

/** First loan year whose closing balance is at or below half the loan. */
const halfwayYear = (rows: readonly ScheduleRow[], loan: number) => {
	const row = rows.find((item) => item.balance * 2 <= loan);
	return row ? Math.ceil(row.month / 12) : null;
};

/**
 * Remaining balance over the loan, drawn from the existing integer-cent
 * ledger. The figure caption states the key facts in text, and the
 * amortization table is the full data equivalent.
 */
const BalanceChart = ({
	rows,
	baseRows,
	loanAmount,
	hypotheticalAfter,
}: BalanceChartProps) => {
	const captionId = useId();
	const months = (baseRows ?? rows).length;
	const line = useMemo(
		() => toPath(yearPoints(rows, loanAmount), months, loanAmount),
		[rows, loanAmount, months],
	);
	const base = useMemo(
		() =>
			baseRows
				? toPath(yearPoints(baseRows, loanAmount), months, loanAmount)
				: null,
		[baseRows, loanAmount, months],
	);
	const years = Math.ceil(months / 12);
	const payoffYear = Math.ceil(rows.length / 12);
	const half = halfwayYear(rows, loanAmount);
	const hypotheticalX =
		hypotheticalAfter && hypotheticalAfter < months
			? (hypotheticalAfter / months) * W
			: null;

	return (
		<Card className="grid min-w-0 grid-cols-1 gap-4">
			<div>
				<p className="text-xs font-bold tracking-widest text-brand-700 uppercase">
					Loan journey
				</p>
				<h2 className="mt-1 text-lg font-semibold">How your balance changes</h2>
			</div>
			<figure aria-labelledby={captionId} className="grid gap-2">
				<div className="flex gap-2">
					<div
						aria-hidden="true"
						className="flex flex-col justify-between py-0.5 text-right text-xs text-slate-600 tabular-nums"
					>
						<span>{compactMoney(loanAmount)}</span>
						<span>{compactMoney(loanAmount / 2)}</span>
						<span>$0</span>
					</div>
					<svg
						aria-hidden="true"
						viewBox={`0 0 ${W} ${H}`}
						preserveAspectRatio="none"
						className="h-44 w-full min-w-0 sm:h-52"
					>
						{hypotheticalX !== null ? (
							<rect
								x={hypotheticalX}
								y={0}
								width={W - hypotheticalX}
								height={H}
								fill="var(--chart-hypothetical)"
							/>
						) : null}
						{[TOP, (H + TOP) / 2, H - 0.5].map((y) => (
							<line
								key={y}
								x1={0}
								x2={W}
								y1={y}
								y2={y}
								stroke="var(--chart-grid)"
								vectorEffect="non-scaling-stroke"
							/>
						))}
						<path
							d={`${line} L${((rows.length / months) * W).toFixed(1)} ${H} L0 ${H} Z`}
							fill="var(--color-brand-100)"
							opacity={0.7}
						/>
						{base ? (
							<path
								d={base}
								fill="none"
								stroke="var(--chart-base-line)"
								strokeWidth={2}
								strokeDasharray="6 5"
								vectorEffect="non-scaling-stroke"
							/>
						) : null}
						<path
							d={line}
							fill="none"
							stroke="var(--color-brand-600)"
							strokeWidth={3}
							strokeLinejoin="round"
							vectorEffect="non-scaling-stroke"
						/>
					</svg>
				</div>
				<div
					aria-hidden="true"
					className="flex justify-between pl-10 text-xs text-slate-600"
				>
					<span>Year 0</span>
					<span>Year {Math.round(years / 2)}</span>
					<span>Year {years}</span>
				</div>
				<ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-700">
					<li className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className="inline-block h-1 w-5 rounded bg-brand-600"
						/>
						{base ? "With extra payments" : "Remaining balance"}
					</li>
					{base ? (
						<li className="flex items-center gap-2">
							<span
								aria-hidden="true"
								className="inline-block w-5 border-t-2 border-dashed border-slate-500"
							/>
							Original schedule
						</li>
					) : null}
					{hypotheticalX !== null ? (
						<li className="flex items-center gap-2">
							<span
								aria-hidden="true"
								className="inline-block size-3 rounded-sm bg-amber-50 ring-1 ring-amber-400"
							/>
							Shaded: hypothetical rates after month {hypotheticalAfter}
						</li>
					) : null}
				</ul>
				<figcaption id={captionId} className="text-sm text-slate-700">
					{`The balance starts at ${compactMoney(loanAmount)}`}
					{half !== null ? `, falls to half by year ${half}` : ""}
					{` and is paid off in year ${payoffYear}`}
					{base ? ` instead of year ${years}` : ""}.
					{hypotheticalX !== null
						? " The path after month 60 uses assumed index values, not a forecast."
						: ""}
				</figcaption>
			</figure>
		</Card>
	);
};

export default BalanceChart;
