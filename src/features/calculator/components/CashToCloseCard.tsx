import { formatMoney } from "@/lib/money";
import type { ClosingCosts } from "../closingCosts";

interface CashToCloseCardProps {
	closing: ClosingCosts | null;
}

const Row = ({
	label,
	amount,
	strong = false,
}: {
	label: string;
	amount: string;
	strong?: boolean;
}) => (
	<div
		className={`flex justify-between gap-4 py-1 ${strong ? "mt-1 border-t border-slate-300 pt-2 font-semibold" : ""}`}
	>
		<dt className={strong ? "text-slate-800" : "text-slate-700"}>{label}</dt>
		<dd className="font-medium text-slate-900">{amount}</dd>
	</div>
);

const CashToCloseCard = ({ closing }: CashToCloseCardProps) => (
	<section
		aria-labelledby="cash-to-close-heading"
		className="rounded-lg bg-white p-4 ring-1 ring-slate-300 sm:p-6"
	>
		<h2
			id="cash-to-close-heading"
			className="text-sm font-medium text-slate-700"
		>
			Cash to close
		</h2>
		<div aria-live="polite">
			{closing ? (
				<>
					<p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
						{formatMoney(closing.cashToClose)}
					</p>
					<dl className="mt-4 border-t border-slate-300/60 pt-4 text-sm">
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

export default CashToCloseCard;
