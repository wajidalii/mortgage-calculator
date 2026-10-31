import { formatMoney } from "@/lib/money";
import type { Refinance } from "../refinance";

interface RefinanceResultProps {
	result: Refinance | null;
	/** True once a field the user has left shows an error. */
	showsErrors: boolean;
}

/** AR-2: every result states its cost and term assumptions. */
const Assumptions = ({ termMonths }: { termMonths: number }) => (
	<ul className="mt-3 list-disc pl-5 text-xs text-slate-600">
		<li>
			The new loan has the same term as the remaining term: {termMonths} months.
		</li>
		<li>Refinance costs are the amount you entered, paid up front.</li>
		<li>
			This is a simple estimate. It does not include taxes, cash-out or the time
			value of money.
		</li>
	</ul>
);

const RefinanceResult = ({ result, showsErrors }: RefinanceResultProps) => (
	<section
		aria-labelledby="refinance-heading"
		className="rounded-lg bg-white p-4 ring-1 ring-slate-300 sm:p-6"
	>
		<h2 id="refinance-heading" className="text-sm font-medium text-slate-700">
			Refinance break-even
		</h2>
		<div aria-live="polite">
			{result ? (
				<>
					{result.breakEvenMonths !== null ? (
						<p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
							{result.breakEvenMonths}
							<span className="ml-1 text-base font-normal text-slate-600">
								months to break even
							</span>
						</p>
					) : (
						<p className="mt-1 text-2xl font-bold text-slate-900">
							<span aria-hidden="true">⚠ </span>No monthly saving
						</p>
					)}
					<dl className="mt-4 grid gap-3 border-t border-slate-300/60 pt-4 text-sm sm:grid-cols-3">
						<div>
							<dt className="text-slate-600">Current payment</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								{formatMoney(result.currentPayment)}
							</dd>
						</div>
						<div>
							<dt className="text-slate-600">New payment</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								{formatMoney(result.newPayment)}
							</dd>
						</div>
						<div>
							<dt className="text-slate-600">
								{result.monthlySaving > 0 ? "Monthly saving" : "Monthly change"}
							</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								{formatMoney(result.monthlySaving)}
							</dd>
						</div>
					</dl>
					{result.breakEvenMonths === null ? (
						<p className="mt-3 text-sm text-slate-700">
							The new payment is not lower than the current one, so the
							refinance costs are never recovered.
						</p>
					) : null}
					<Assumptions termMonths={result.termMonths} />
				</>
			) : (
				<p className="mt-1 text-base text-slate-700">
					{showsErrors
						? "Fix the highlighted fields to see the break-even."
						: "Enter your current loan and the new rate to see the break-even."}
				</p>
			)}
		</div>
	</section>
);

export default RefinanceResult;
