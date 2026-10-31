import { formatMoney } from "@/lib/money";
import type { EstimateLine, MonthlyEstimate } from "../monthlyEstimate";

interface PaymentBreakdownProps {
	estimate: MonthlyEstimate;
	/** Replaces the principal and interest label, e.g. for an ARM's first period. */
	piLabel?: string | undefined;
}

/** Ring and dot colors per line. The ring is a picture of the lines listed beside it. */
const COLORS: Record<EstimateLine["id"], string> = {
	pi: "#137b79",
	tax: "#6e8fcd",
	insurance: "#eab776",
	pmi: "#a78bcd",
	hoa: "#7c9aa3",
	other: "#c4d4d6",
};

const RING_RADIUS = 15.9155; // circumference 100, so a share is its percent
const RING_BASE = 4;

const Lines = ({
	lines,
	piLabel,
}: {
	lines: readonly EstimateLine[];
	piLabel?: string | undefined;
}) => (
	<>
		{lines.map((line) => (
			<div key={line.id} className="flex justify-between gap-4 py-1">
				<dt className="flex items-center gap-2 text-slate-700">
					<span
						aria-hidden="true"
						className="size-2.5 shrink-0 rounded-full"
						style={{ backgroundColor: COLORS[line.id] }}
					/>
					{line.id === "pi" && piLabel ? piLabel : line.label}
				</dt>
				<dd className="font-medium tabular-nums text-slate-900">
					{formatMoney(line.amount)}
				</dd>
			</div>
		))}
	</>
);

const Subtotal = ({ label, amount }: { label: string; amount: string }) => (
	<div className="mt-1 flex justify-between gap-4 border-t border-slate-300 pt-2">
		<dt className="font-semibold text-slate-800">{label}</dt>
		<dd className="font-semibold tabular-nums text-slate-900">{amount}</dd>
	</div>
);

/**
 * Where each monthly dollar goes. The ring is decorative (aria-hidden): every
 * share is also listed with its label and amount, so no meaning is color only.
 */
const PaymentBreakdown = ({ estimate, piLabel }: PaymentBreakdownProps) => {
	const all = [...estimate.lender, ...estimate.nonEscrow];
	const total = estimate.total;
	let offset = 0;
	const segments = all
		.filter((line) => line.amount > 0 && total > 0)
		.map((line) => {
			const share = (line.amount / total) * 100;
			const segment = { id: line.id, share, offset };
			offset += share;
			return segment;
		});
	const piShare = all[0] && total > 0 ? (all[0].amount / total) * 100 : 0;

	return (
		<div className="grid items-start gap-5 sm:grid-cols-[auto_1fr] lg:grid-cols-1 xl:grid-cols-[auto_1fr]">
			<div className="relative mx-auto size-36 shrink-0">
				<svg
					viewBox="0 0 40 40"
					className="size-full -rotate-90"
					aria-hidden="true"
				>
					<circle
						cx="20"
						cy="20"
						r={RING_RADIUS}
						fill="none"
						stroke="#e2eaec"
						strokeWidth={RING_BASE}
					/>
					{segments.map((segment) => (
						<circle
							key={segment.id}
							cx="20"
							cy="20"
							r={RING_RADIUS}
							fill="none"
							stroke={COLORS[segment.id]}
							strokeWidth={RING_BASE}
							strokeDasharray={`${Math.max(segment.share - 0.6, 0.1)} ${100 - Math.max(segment.share - 0.6, 0.1)}`}
							strokeDashoffset={-segment.offset}
						/>
					))}
				</svg>
				<div
					aria-hidden="true"
					className="absolute inset-0 grid place-content-center text-center"
				>
					<span className="text-xl font-bold text-slate-900">
						{Math.round(piShare)}%
					</span>
					<span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
						Loan payment
					</span>
				</div>
			</div>
			<div className="grid min-w-0 gap-4 text-sm">
				<div>
					<h3 className="font-semibold text-slate-800">
						Lender payment (escrow)
					</h3>
					<dl className="mt-1">
						<Lines lines={estimate.lender} piLabel={piLabel} />
						<Subtotal
							label="Lender payment"
							amount={formatMoney(estimate.lenderPayment)}
						/>
					</dl>
				</div>
				<div>
					<h3 className="font-semibold text-slate-800">Non-escrow</h3>
					<dl className="mt-1">
						<Lines lines={estimate.nonEscrow} />
						<Subtotal
							label="Non-escrow total"
							amount={formatMoney(estimate.nonEscrowTotal)}
						/>
					</dl>
				</div>
			</div>
		</div>
	);
};

export default PaymentBreakdown;
