import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import { buildHomePreview } from "../preview";

const preview = buildHomePreview();

const SERIES_COLOR = {
	pi: "var(--color-series-pi)",
	tax: "var(--color-series-tax)",
	insurance: "var(--color-series-insurance)",
} as const;

const W = 320;
const H = 72;

/** A decorative balance curve; the figures beside it carry the meaning. */
const BalanceSparkline = () => {
	const step = W / (preview.balanceCurve.length - 1);
	const points = preview.balanceCurve.map(
		(fraction, index) =>
			`${(index * step).toFixed(1)},${(4 + (1 - fraction) * (H - 8)).toFixed(1)}`,
	);
	const line = `M${points.join(" L")}`;
	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			role="img"
			aria-label="Loan balance falling from the full loan amount to zero over 30 years"
			className="h-16 w-full"
			preserveAspectRatio="none"
		>
			<path d={`${line} L${W},${H} L0,${H}Z`} fill="var(--color-brand-100)" />
			<path
				d={line}
				fill="none"
				stroke="var(--color-brand-600)"
				strokeWidth="2.5"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
};

/**
 * A static example of the calculator's main result. It is a picture of the
 * product, labelled as an example, not a live widget.
 */
const PaymentPreview = () => {
	const stops: string[] = [];
	let from = 0;
	for (const line of preview.lines) {
		stops.push(`${SERIES_COLOR[line.id]} ${from}% ${from + line.percent}%`);
		from += line.percent;
	}

	return (
		<figure
			aria-labelledby="preview-caption"
			className="rounded-2xl bg-white p-5 text-slate-900 shadow-panel ring-1 ring-white/20 sm:p-6"
		>
			<div className="flex items-center justify-between gap-3">
				<p className="text-xs font-bold tracking-widest text-brand-700 uppercase">
					Estimated monthly cost
				</p>
				<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950">
					Example
				</span>
			</div>

			<p className="mt-2 font-display text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
				{formatMoney(preview.total)}
			</p>
			<p className="mt-1 text-sm text-slate-600">
				{formatMoney(preview.price)} home, {preview.downPercent}% down,{" "}
				{formatPercent(preview.rate)} for {preview.termYears} years
			</p>

			<div className="mt-5 flex items-center gap-5">
				<div
					aria-hidden="true"
					className="relative grid size-28 shrink-0 place-items-center rounded-full"
					style={{ background: `conic-gradient(${stops.join(", ")})` }}
				>
					<div className="size-[4.5rem] rounded-full bg-white" />
				</div>
				<ul className="grid flex-1 gap-2.5 text-sm">
					{preview.lines.map((line) => (
						<li key={line.id} className="flex items-center gap-2">
							<span
								aria-hidden="true"
								className="size-3 shrink-0 rounded-sm"
								style={{ background: SERIES_COLOR[line.id] }}
							/>
							<span className="flex-1 text-slate-700">{line.label}</span>
							<span className="font-semibold tabular-nums">
								{formatMoney(line.amount)}
							</span>
						</li>
					))}
				</ul>
			</div>

			<div className="mt-5 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
				<BalanceSparkline />
				<div className="mt-1 flex justify-between text-xs text-slate-600">
					<span>Loan balance: {formatMoney(preview.loan)}</span>
					<span>Year {preview.termYears}: $0</span>
				</div>
			</div>

			<dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
				<div>
					<dt className="text-slate-600">Interest over the loan</dt>
					<dd className="font-semibold tabular-nums">
						about {formatMoney(preview.lifetimeInterest)}
					</dd>
				</div>
				<div>
					<dt className="text-slate-600">Loan amount</dt>
					<dd className="font-semibold tabular-nums">
						{formatMoney(preview.loan)}
					</dd>
				</div>
			</dl>

			<figcaption
				id="preview-caption"
				className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600"
			>
				Sample numbers. Tax and insurance are illustrative. Your results use
				your own inputs.
			</figcaption>
		</figure>
	);
};

export default PaymentPreview;
