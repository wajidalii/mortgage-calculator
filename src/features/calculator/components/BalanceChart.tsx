import type { ScheduleRow } from "@/lib/amortization";
import { formatMoney } from "@/lib/money";
import { buildBalanceSeries } from "../chartSeries";

interface BalanceChartProps {
	rows: readonly (ScheduleRow & { hypothetical?: boolean })[];
}

const WIDTH = 100;
const HEIGHT = 50;
const compact = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	notation: "compact",
	maximumFractionDigits: 1,
});

/** Lightweight inline SVG of the existing ledger. The table below is its data equivalent. */
const BalanceChart = ({ rows }: BalanceChartProps) => {
	const series = buildBalanceSeries(rows);
	if (!series) return null;
	const { points, months, startBalance, totalInterest, hypotheticalFrom } =
		series;
	const top = Math.max(startBalance, totalInterest, 1);
	const x = (month: number) => (month / months) * WIDTH;
	const y = (cents: number) => HEIGHT - (cents / top) * HEIGHT;
	const line = (pick: (point: (typeof points)[number]) => number) =>
		points
			.map(
				(point, i) =>
					`${i === 0 ? "M" : "L"}${x(point.month).toFixed(2)} ${y(pick(point)).toFixed(2)}`,
			)
			.join(" ");
	const balanceLine = line((point) => point.balance);
	const years = months / 12;
	const yearsLabel = Number.isInteger(years) ? `${years}` : years.toFixed(1);
	const description = `Line chart over ${yearsLabel} years. Remaining balance falls from ${formatMoney(startBalance)} to ${formatMoney(points[points.length - 1]?.balance ?? startBalance)}. Interest paid so far rises to ${formatMoney(totalInterest)}.${hypotheticalFrom ? ` Rates after month ${hypotheticalFrom - 1} are hypothetical.` : ""} The amortization table has the same numbers.`;

	return (
		<figure className="grid gap-3">
			<div className="grid grid-cols-[auto_1fr] gap-x-2">
				<div
					aria-hidden="true"
					className="flex flex-col justify-between pb-0 text-xs tabular-nums text-slate-600"
				>
					<span>{compact.format(top / 100)}</span>
					<span>{compact.format(top / 200)}</span>
					<span>$0</span>
				</div>
				<svg
					role="img"
					aria-label={description}
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					preserveAspectRatio="none"
					className="h-44 w-full overflow-visible rounded-md bg-slate-50 sm:h-56"
				>
					{[0, 0.5, 1].map((fraction) => (
						<line
							key={fraction}
							x1="0"
							x2={WIDTH}
							y1={HEIGHT * fraction}
							y2={HEIGHT * fraction}
							stroke="#dce7e9"
							strokeWidth="1"
							vectorEffect="non-scaling-stroke"
						/>
					))}
					{hypotheticalFrom ? (
						<rect
							x={x(hypotheticalFrom - 1)}
							y="0"
							width={WIDTH - x(hypotheticalFrom - 1)}
							height={HEIGHT}
							fill="#fdf3e0"
						/>
					) : null}
					<path
						d={`${balanceLine} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`}
						fill="#137b79"
						fillOpacity="0.1"
					/>
					<path
						d={balanceLine}
						fill="none"
						stroke="#137b79"
						strokeWidth="2.5"
						vectorEffect="non-scaling-stroke"
					/>
					<path
						d={line((point) => point.interestPaid)}
						fill="none"
						stroke="#3d5fa8"
						strokeWidth="2.5"
						strokeDasharray="6 4"
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
				<span />
				<div
					aria-hidden="true"
					className="mt-1 flex justify-between text-xs text-slate-600"
				>
					<span>Start</span>
					<span>Year {Math.round(years / 2)}</span>
					<span>Year {yearsLabel}</span>
				</div>
			</div>
			<figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-700">
				<span className="flex items-center gap-2">
					<svg width="22" height="6" aria-hidden="true">
						<line
							x1="0"
							x2="22"
							y1="3"
							y2="3"
							stroke="#137b79"
							strokeWidth="3"
						/>
					</svg>
					Remaining balance
				</span>
				<span className="flex items-center gap-2">
					<svg width="22" height="6" aria-hidden="true">
						<line
							x1="0"
							x2="22"
							y1="3"
							y2="3"
							stroke="#3d5fa8"
							strokeWidth="3"
							strokeDasharray="5 3"
						/>
					</svg>
					Interest paid so far
				</span>
				{hypotheticalFrom ? (
					<span className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className="size-3 rounded-sm bg-amber-100 ring-1 ring-amber-400"
						/>
						Shaded: hypothetical rate
					</span>
				) : null}
			</figcaption>
		</figure>
	);
};

export default BalanceChart;
