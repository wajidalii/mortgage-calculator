import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { CostGrowth } from "../costGrowth";

interface CostGrowthTableProps {
	growth: CostGrowth | null;
}

const HEAD = "px-3 py-2 text-right font-medium";
const CELL = "px-3 py-2 text-right tabular-nums";

const CostGrowthTable = ({ growth }: CostGrowthTableProps) =>
	growth ? (
		<section
			aria-labelledby="cost-growth-heading"
			className="rounded-lg bg-white p-4 ring-1 ring-slate-300 sm:p-6"
		>
			<div className="flex flex-wrap items-center gap-2">
				<h2
					id="cost-growth-heading"
					className="text-sm font-medium text-slate-700"
				>
					Tax and insurance by year
				</h2>
				{growth.applied ? (
					<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-400">
						Assumption
					</span>
				) : null}
			</div>
			<p className="mt-1 text-sm text-slate-600">
				{growth.applied
					? `Assumes property tax grows ${formatPercent(growth.taxGrowth, 2)} and insurance grows ${formatPercent(growth.insuranceGrowth, 2)} each year. Real costs can differ.`
					: "No growth is applied: tax and insurance stay the same each year."}
			</p>
			<section
				// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
				tabIndex={0}
				aria-label="Tax and insurance by year table"
				className="mt-3 max-h-96 overflow-auto rounded-md ring-1 ring-slate-200 focus-visible:outline-2 focus-visible:outline-brand-500"
			>
				<table className="w-full min-w-[32rem] text-sm">
					<caption className="sr-only">
						Monthly property tax and insurance for each loan year
					</caption>
					<thead className="sticky top-0 bg-slate-100 text-slate-700">
						<tr>
							<th scope="col" className="px-3 py-2 text-left font-medium">
								Year
							</th>
							<th scope="col" className={HEAD}>
								Tax per month
							</th>
							<th scope="col" className={HEAD}>
								Insurance per month
							</th>
							<th scope="col" className={HEAD}>
								Tax and insurance per year
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{growth.years.map((row) => (
							<tr key={row.year}>
								<th scope="row" className="px-3 py-2 text-left font-normal">
									{row.year}
								</th>
								<td className={CELL}>{formatMoney(row.monthlyTax)}</td>
								<td className={CELL}>{formatMoney(row.monthlyInsurance)}</td>
								<td className={CELL}>
									{formatMoney(
										(row.annualTax +
											row.annualInsurance) as typeof row.annualTax,
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</section>
	) : null;

export default CostGrowthTable;
