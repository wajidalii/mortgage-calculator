import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
	lifetimeInterest,
	type ScheduleRow,
	summarizeByYear,
} from "@/lib/amortization";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { formatRate } from "@/lib/rate";
import type { Micros } from "@/types/units";

/** A fixed ledger row, or an ARM row that also carries its rate and label flag. */
type ScheduleTableRow = ScheduleRow & {
	rate?: Micros;
	hypothetical?: boolean;
};

interface ScheduleTableProps {
	rows: readonly ScheduleTableRow[];
}

/** The PRD 8.5 label. Text, so it never relies on color alone. */
const HypotheticalBadge = () => (
	<span className="ml-2 whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-400">
		Hypothetical rate
	</span>
);

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
	const isArm = rows.some((row) => row.rate !== undefined);
	// Loan years holding any month after the fixed period, and each year's last rate.
	const hypotheticalYears = useMemo(
		() =>
			new Set(
				rows
					.filter((row) => row.hypothetical)
					.map((row) => Math.ceil(row.month / 12)),
			),
		[rows],
	);
	const yearEndRate = useMemo(() => {
		const rates = new Map<number, Micros>();
		for (const row of rows) {
			if (row.rate !== undefined)
				rates.set(Math.ceil(row.month / 12), row.rate);
		}
		return rates;
	}, [rows]);

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
			? rows.map((row) => ({
					key: row.month,
					label: row.month,
					hypothetical: row.hypothetical === true,
					rate: row.rate,
					...row,
				}))
			: years.map((row) => ({
					key: row.year,
					label: row.year,
					hypothetical: hypotheticalYears.has(row.year),
					rate: yearEndRate.get(row.year),
					...row,
				}));

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
							className="min-h-11 px-3 py-1 first:rounded-r-none last:rounded-l-none"
						>
							{item.label}
						</Button>
					))}
				</fieldset>
			</div>
			{isArm ? (
				<p className="text-sm text-slate-700">
					Rows after month 60 use index values we assumed. The real rate may be
					higher or lower.
				</p>
			) : null}
			<section
				// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
				tabIndex={0}
				aria-label={`${view === "monthly" ? "Monthly" : "Yearly"} amortization schedule`}
				className="max-h-96 overflow-auto rounded-md ring-1 ring-slate-200 focus-visible:outline-2 focus-visible:outline-brand-500"
			>
				<table
					className={cn(
						"w-full text-sm",
						isArm ? "min-w-[40rem]" : "min-w-[32rem]",
					)}
				>
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
							{isArm ? (
								<th scope="col" className={HEAD}>
									{view === "monthly" ? "Rate" : "Rate at year end"}
								</th>
							) : null}
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
									{row.hypothetical ? <HypotheticalBadge /> : null}
								</th>
								{isArm ? (
									<td className={CELL}>
										{row.rate === undefined ? "" : formatRate(row.rate)}
									</td>
								) : null}
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
