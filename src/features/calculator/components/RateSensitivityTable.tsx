import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { SensitivityRow } from "../rateSensitivity";

interface RateSensitivityTableProps {
	rows: readonly SensitivityRow[] | null;
}

const HEAD = "px-3 py-2 text-right font-medium";
const CELL = "px-3 py-2 text-right tabular-nums";

const signed = (row: SensitivityRow): string =>
	row.isBase
		? "Base rate"
		: `${row.difference > 0 ? "+" : "-"}${formatMoney(Math.abs(row.difference) as typeof row.difference)}`;

const RateSensitivityTable = ({ rows }: RateSensitivityTableProps) =>
	rows ? (
		<section
			aria-labelledby="sensitivity-heading"
			className="rounded-2xl bg-white p-4 shadow-panel ring-1 ring-slate-200 sm:p-6"
		>
			<h2
				id="sensitivity-heading"
				className="text-lg font-semibold text-slate-900"
			>
				Rate sensitivity
			</h2>
			<p className="mt-1 text-sm text-slate-600">
				Monthly principal and interest for the same loan and term at nearby
				rates.
			</p>
			<table className="mt-3 w-full text-sm">
				<caption className="sr-only">
					Monthly principal and interest by interest rate
				</caption>
				<thead className="bg-slate-50 text-slate-600">
					<tr>
						<th scope="col" className="px-3 py-2 text-left font-medium">
							Rate
						</th>
						<th scope="col" className={HEAD}>
							Payment
						</th>
						<th scope="col" className={HEAD}>
							Compared to base
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
					{rows.map((row) => (
						<tr key={row.rate} className={row.isBase ? "font-semibold" : ""}>
							<th scope="row" className="px-3 py-2 text-left font-[inherit]">
								{formatPercent(row.rate, 2)}
							</th>
							<td className={CELL}>{formatMoney(row.payment)}</td>
							<td className={CELL}>{signed(row)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	) : null;

export default RateSensitivityTable;
