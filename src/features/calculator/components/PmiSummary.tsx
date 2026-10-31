import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { PmiResult } from "../pmi";

interface PmiSummaryProps {
	result: PmiResult | null;
}

const PmiSummary = ({ result }: PmiSummaryProps) => (
	<section aria-labelledby="pmi-heading" className="py-5 first:pt-0 last:pb-0">
		<h3 id="pmi-heading" className="text-sm font-semibold text-slate-900">
			Private mortgage insurance (PMI)
		</h3>
		<div aria-live="polite">
			{result?.status === "on" ? (
				<>
					<p className="mt-1 text-xl font-bold tracking-tight text-slate-900 tabular-nums">
						{formatMoney(result.pmi.monthly)}
						<span className="ml-1 text-base font-normal text-slate-600">
							/ month
						</span>
					</p>
					<p className="text-sm text-slate-600">
						Lender payment (escrow) · {formatPercent(result.pmi.rate, 2)} per
						year on the original loan
						{result.pmi.rateIsDefault ? " · " : ""}
						{result.pmi.rateIsDefault ? (
							<strong>Illustrative estimate</strong>
						) : null}
					</p>
					<dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<dt className="text-slate-600">Can request removal</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								Month {result.pmi.removalMonth}
							</dd>
							<dd className="text-xs text-slate-600">
								First month the scheduled balance is at or below 80% of the home
								price.
							</dd>
						</div>
						<div>
							<dt className="text-slate-600">PMI ends</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								Month {result.pmi.endsMonth}
							</dd>
							<dd className="text-xs text-slate-600">
								First month the scheduled balance is at or below 78% of the home
								price.
							</dd>
						</div>
					</dl>
				</>
			) : result?.status === "turned-off" ? (
				<p className="mt-1 text-base text-slate-700">PMI is turned off.</p>
			) : result?.status === "not-required" ? (
				<p className="mt-1 text-base text-slate-700">
					PMI is off: the loan is 80% of the home price or less.
				</p>
			) : (
				<p className="mt-1 text-base text-slate-700">
					Fix the highlighted fields to see the PMI estimate.
				</p>
			)}
		</div>
	</section>
);

export default PmiSummary;
