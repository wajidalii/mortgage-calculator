import { formatMoney } from "@/lib/money";
import type { ExtraPayments } from "../extraPayments";

interface ExtraPaymentsSummaryProps {
	extra: ExtraPayments | null;
}

const ExtraPaymentsSummary = ({ extra }: ExtraPaymentsSummaryProps) =>
	extra ? (
		<section
			aria-labelledby="extra-heading"
			className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-200 sm:p-5"
		>
			<h2 id="extra-heading" className="text-sm font-semibold text-brand-900">
				With extra payments
			</h2>
			<dl aria-live="polite" className="mt-2 grid grid-cols-2 gap-3 text-sm">
				<div>
					<dt className="text-slate-600">Paid off in</dt>
					<dd className="mt-0.5 text-lg font-semibold text-slate-900">
						Month {extra.payoffMonth}
					</dd>
					<dd className="text-xs text-slate-600">
						{extra.monthsSaved} months sooner
					</dd>
				</div>
				<div>
					<dt className="text-slate-600">Interest saved</dt>
					<dd className="mt-0.5 text-lg font-semibold text-slate-900">
						{formatMoney(extra.interestSaved)}
					</dd>
					<dd className="text-xs text-slate-600">
						Versus the original schedule
					</dd>
				</div>
			</dl>
			<p className="mt-3 text-xs text-slate-600">
				Lifetime interest, the chart and the schedule include your extra
				payments. PMI can be requested sooner; it still ends at the 78% month of
				the original schedule.
			</p>
		</section>
	) : null;

export default ExtraPaymentsSummary;
