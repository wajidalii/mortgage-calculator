import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
	lifetimeInterest,
	type ScheduleRow,
	summarizeByYear,
} from "@/lib/amortization";
import { formatMoney } from "@/lib/money";

interface ScheduleTableProps {
	rows: readonly ScheduleRow[];
}

type View = "monthly" | "yearly";

const VIEWS: { view: View; label: string }[] = [
	{ view: "monthly", label: "Monthly" },
	{ view: "yearly", label: "Yearly" },
];

const HEAD = "px-3 py-2 text-right font-medium";
const CELL = "px-3 py-2 text-right tabular-nums";

const ScheduleTable = ({ rows }: ScheduleTableProps) => {
	const [view, setView] = useState<View>("yearly");
	const years = useMemo(() => summarizeByYear(rows), [rows]);
	const totalInterest = useMemo(() => lifetimeInterest(rows), [rows]);

	if (rows.length === 0) {
		return (
			<Card>
				<h2 className="text-lg font-semibold">Amortization schedule</h2>
				<p className="mt-2 text-sm text-slate-700">
					There is no schedule because the loan amount is $0.
				</p>
			</Card>
		);
	}

	const periodLabel = view === "monthly" ? "Month" : "Year";
	const body =
		view === "monthly"
			? rows.map((row) => ({ key: row.month, label: row.month, ...row }))
			: years.map((row) => ({ key: row.year, label: row.year, ...row }));

	return (
		<Card className="grid gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold">Amortization schedule</h2>
					<p className="text-sm text-slate-600">
						Lifetime interest{" "}
						<strong className="font-semibold text-slate-900">
							{formatMoney(totalInterest)}
						</strong>{" "}
						over {rows.length} payments
					</p>
				</div>
				<fieldset>
					<legend className="sr-only">Schedule view</legend>
					{VIEWS.map((item) => (
						<Button
							key={item.view}
							variant={view === item.view ? "primary" : "secondary"}
							aria-pressed={view === item.view}
							onClick={() => setView(item.view)}
							className="px-3 py-1 first:rounded-r-none last:rounded-l-none"
						>
							{item.label}
						</Button>
					))}
				</fieldset>
			</div>
			<section
				// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
				tabIndex={0}
				aria-label={`${view === "monthly" ? "Monthly" : "Yearly"} amortization schedule`}
				className="max-h-96 overflow-auto rounded-md ring-1 ring-slate-200 focus-visible:outline-2 focus-visible:outline-brand-500"
			>
				<table className="w-full min-w-[32rem] text-sm">
					<caption className="sr-only">
						{view === "monthly" ? "Payment" : "Yearly totals"} by{" "}
						{periodLabel.toLowerCase()}: payment, principal, interest and
						remaining balance
					</caption>
					<thead className="sticky top-0 bg-slate-100 text-slate-700">
						<tr>
							<th scope="col" className="px-3 py-2 text-left font-medium">
								{periodLabel}
							</th>
							<th scope="col" className={HEAD}>
								Payment
							</th>
							<th scope="col" className={HEAD}>
								Principal
							</th>
							<th scope="col" className={HEAD}>
								Interest
							</th>
							<th scope="col" className={HEAD}>
								Balance
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{body.map((row) => (
							<tr key={row.key}>
								<th scope="row" className="px-3 py-2 text-left font-normal">
									{row.label}
								</th>
								<td className={CELL}>{formatMoney(row.payment)}</td>
								<td className={CELL}>{formatMoney(row.principal)}</td>
								<td className={CELL}>{formatMoney(row.interest)}</td>
								<td className={CELL}>{formatMoney(row.balance)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</Card>
	);
};

export default ScheduleTable;
