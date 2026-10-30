import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { LoanDerivation } from "../types";

interface LoanSummaryProps {
	loan: LoanDerivation | null;
}

const LoanSummary = ({ loan }: LoanSummaryProps) => (
	<section
		aria-labelledby="loan-summary-heading"
		className="rounded-lg bg-brand-50 p-4 sm:p-6 ring-1 ring-brand-500/30"
	>
		<h2
			id="loan-summary-heading"
			className="text-sm font-medium text-slate-700"
		>
			Monthly principal and interest
		</h2>
		{/* Announce result changes without moving focus. */}
		<div aria-live="polite">
			{loan ? (
				<>
					<p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
						{formatMoney(loan.monthlyPrincipalAndInterest)}
						<span className="ml-1 text-base font-normal text-slate-600">
							/ month
						</span>
					</p>
					<dl className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-300/60 pt-4 text-sm sm:grid-cols-3">
						<div>
							<dt className="text-slate-600">Loan amount</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								{formatMoney(loan.loanAmount)}
							</dd>
						</div>
						<div>
							<dt className="text-slate-600">Loan-to-value (LTV)</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								{formatPercent(loan.ltv, 2)}
							</dd>
						</div>
						<div>
							<dt className="text-slate-600">Down payment</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								{formatMoney(loan.downPayment)}
								<span className="ml-1 text-sm font-normal text-slate-600">
									({formatPercent(loan.downPaymentPercent, 2)})
								</span>
							</dd>
						</div>
					</dl>
				</>
			) : (
				<p className="mt-1 text-base text-slate-700">
					Fix the highlighted fields to see the payment, loan amount and LTV.
				</p>
			)}
		</div>
	</section>
);

export default LoanSummary;
