import { formatMoney } from "@/lib/money";
import type { Cents } from "@/types/units";
import type { EstimateLine, MonthlyEstimate } from "../monthlyEstimate";

interface PaymentBreakdownProps {
	estimate: MonthlyEstimate;
	/** Replaces the P&I label, for example for an ARM's first period. */
	piLabel?: string | undefined;
}

/** CSS color for each line; the line's text label always sits next to it. */
const seriesColor = (id: EstimateLine["id"]): string =>
	`var(--color-series-${id})`;

/** Whole-percent share for display only. The amounts themselves stay in cents. */
const share = (amount: number, total: number): number =>
	total > 0 ? Math.round((amount * 100) / total) : 0;

const labelFor = (line: EstimateLine, piLabel: string | undefined) =>
	line.id === "pi" && piLabel ? piLabel : line.label;

const Donut = ({
	lines,
	total,
	piLabel,
}: {
	lines: readonly EstimateLine[];
	total: number;
	piLabel: string | undefined;
}) => {
	const visible = lines.filter((line) => line.amount > 0);
	let start = 0;
	const stops = visible.map((line) => {
		const from = start;
		start += (line.amount * 100) / total;
		return `${seriesColor(line.id)} ${from}% ${start}%`;
	});
	const pi = lines.find((line) => line.id === "pi");
	const description = visible
		.map(
			(line) =>
				`${labelFor(line, piLabel)} ${share(line.amount, total)} percent`,
		)
		.join(", ");
	return (
		<div
			role="img"
			aria-label={`Share of the monthly total: ${description}.`}
			className="relative grid size-32 shrink-0 place-items-center rounded-full sm:size-36"
			style={{ background: `conic-gradient(${stops.join(", ")})` }}
		>
			<div className="grid size-22 place-items-center rounded-full bg-white text-center sm:size-24">
				<div aria-hidden="true">
					<span className="block text-[0.65rem] font-bold tracking-wider text-slate-500 uppercase">
						Loan P&amp;I
					</span>
					<span className="text-lg font-extrabold text-slate-900">
						{share(pi?.amount ?? 0, total)}%
					</span>
				</div>
			</div>
		</div>
	);
};

const Lines = ({
	lines,
	piLabel,
}: {
	lines: readonly EstimateLine[];
	piLabel: string | undefined;
}) => (
	<>
		{lines.map((line) => (
			<div
				key={line.id}
				className="flex items-baseline justify-between gap-4 py-1.5"
			>
				<dt className="flex items-center text-slate-700">
					<span
						aria-hidden="true"
						className="mr-2 inline-block size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
						style={{ background: seriesColor(line.id) }}
					/>
					{labelFor(line, piLabel)}
				</dt>
				<dd className="font-semibold text-slate-900 tabular-nums">
					{formatMoney(line.amount)}
				</dd>
			</div>
		))}
	</>
);

const Group = ({
	title,
	note,
	lines,
	totalLabel,
	total,
	piLabel,
}: {
	title: string;
	note: string;
	lines: readonly EstimateLine[];
	totalLabel: string;
	total: Cents;
	piLabel?: string | undefined;
}) => (
	<div>
		<h3 className="font-semibold text-slate-900">{title}</h3>
		<p className="text-xs text-slate-600">{note}</p>
		<dl className="mt-1 divide-y divide-slate-100">
			<Lines lines={lines} piLabel={piLabel} />
			<div className="flex items-baseline justify-between gap-4 border-t border-slate-300 pt-2">
				<dt className="font-semibold text-slate-800">{totalLabel}</dt>
				<dd className="font-bold text-slate-900 tabular-nums">
					{formatMoney(total)}
				</dd>
			</div>
		</dl>
	</div>
);

/**
 * The itemized monthly estimate as a donut plus two lists. Escrow lines (paid
 * to the lender) and non-escrow lines (paid by the owner) stay separate.
 */
const PaymentBreakdown = ({ estimate, piLabel }: PaymentBreakdownProps) => (
	<div className="@container">
		<div className="flex flex-col items-center gap-5 @md:flex-row @md:items-start">
			{estimate.total > 0 ? (
				<Donut
					lines={[...estimate.lender, ...estimate.nonEscrow]}
					total={estimate.total}
					piLabel={piLabel}
				/>
			) : null}
			<div className="@container w-full min-w-0 flex-1">
				<div className="grid gap-5 text-sm @lg:grid-cols-2">
					<Group
						title="Lender payment (escrow)"
						note="Paid to your lender each month"
						lines={estimate.lender}
						totalLabel="Lender payment"
						total={estimate.lenderPayment}
						piLabel={piLabel}
					/>
					<Group
						title="Non-escrow"
						note="Paid by you, outside the loan"
						lines={estimate.nonEscrow}
						totalLabel="Non-escrow total"
						total={estimate.nonEscrowTotal}
					/>
				</div>
			</div>
		</div>
	</div>
);

export default PaymentBreakdown;
