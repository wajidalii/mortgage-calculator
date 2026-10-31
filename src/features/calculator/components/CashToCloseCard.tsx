import { useValueFlash } from "@/hooks/useValueFlash";
import { formatMoney } from "@/lib/money";
import type { ClosingCosts } from "../closingCosts";

interface CashToCloseCardProps {
	closing: ClosingCosts | null;
}

const Row = ({
	label,
	amount,
	strong = false,
	flash = 0,
}: {
	label: string;
	amount: string;
	strong?: boolean;
	/** Change count; above zero plays the highlight, and a new count replays it. */
	flash?: number;
}) => (
	<div
		className={`flex justify-between gap-4 py-1 ${strong ? "mt-1 border-t border-slate-300 pt-2 font-semibold" : ""}`}
	>
		<dt className={strong ? "text-slate-800" : "text-slate-700"}>{label}</dt>
		<dd
			key={flash}
			className={`-mr-1.5 rounded-md px-1.5 font-medium text-slate-900 tabular-nums ${flash > 0 ? "motion-safe:animate-flash" : ""}`}
		>
			{amount}
		</dd>
	</div>
);

const CashToCloseCard = ({ closing }: CashToCloseCardProps) => {
	const flash = useValueFlash(closing?.cashToClose ?? null, true);
	return (
		<section
			aria-labelledby="cash-to-close-heading"
			className="rounded-2xl bg-white p-4 shadow-panel ring-1 ring-slate-200 sm:p-6"
		>
			<h2
				id="cash-to-close-heading"
				className="text-lg font-semibold text-slate-900"
			>
				Cash to close
			</h2>
			<div aria-live="polite">
				{closing ? (
					<>
						<dl className="mt-3 text-sm">
							<Row
								label="Down payment"
								amount={formatMoney(closing.downPayment)}
							/>
							{closing.lines
								.filter((line) => line.amount > 0)
								.map((line) => (
									<Row
										key={line.id}
										label={line.label}
										amount={formatMoney(line.amount)}
									/>
								))}
							<Row
								label="Closing costs total"
								amount={formatMoney(closing.total)}
							/>
							{closing.credits > 0 ? (
								<Row
									label="Credits"
									amount={`-${formatMoney(closing.credits)}`}
								/>
							) : null}
							<Row
								label="Cash to close"
								amount={formatMoney(closing.cashToClose)}
								strong
								flash={flash}
							/>
						</dl>
						<p className="mt-3 text-xs text-slate-600">
							Closing costs are the amounts you entered. We do not estimate fees
							or transfer taxes.
						</p>
					</>
				) : (
					<p className="mt-1 text-base text-slate-700">
						Fix the highlighted fields to see the cash to close.
					</p>
				)}
			</div>
		</section>
	);
};

export default CashToCloseCard;
