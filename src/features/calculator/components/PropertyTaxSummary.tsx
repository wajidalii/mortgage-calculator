import { formatMoney } from "@/lib/money";
import { formatPercent } from "@/lib/rate";
import type { PropertyTax } from "../propertyTax";

interface PropertyTaxSummaryProps {
	tax: PropertyTax | null;
}

const PropertyTaxSummary = ({ tax }: PropertyTaxSummaryProps) => (
	<section
		aria-labelledby="property-tax-heading"
		className="rounded-lg bg-white p-4 sm:p-6 ring-1 ring-slate-300"
	>
		<h2
			id="property-tax-heading"
			className="text-sm font-medium text-slate-700"
		>
			Estimated property tax
		</h2>
		<div aria-live="polite">
			{tax ? (
				<>
					<p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
						{formatMoney(tax.monthly)}
						<span className="ml-1 text-base font-normal text-slate-600">
							/ month
						</span>
					</p>
					<dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
						<div>
							<dt className="text-slate-600">Annual property tax</dt>
							<dd className="mt-0.5 text-lg font-semibold text-slate-900">
								{formatMoney(tax.annual)}
							</dd>
						</div>
						{tax.lastMonth !== tax.monthly ? (
							<div>
								<dt className="text-slate-600">Month 12</dt>
								<dd className="mt-0.5 text-lg font-semibold text-slate-900">
									{formatMoney(tax.lastMonth)}
								</dd>
								<dd className="text-xs text-slate-600">
									Includes the rounding remainder so 12 months add up to the
									annual amount.
								</dd>
							</div>
						) : null}
					</dl>
					<p className="mt-3 text-sm text-slate-700">
						{tax.source === "manual" ? (
							<strong>Manual override</strong>
						) : (
							<>
								<strong>Illustrative estimate</strong>
								{`: ${tax.state} demo rate ${formatPercent(tax.rate, 2)} of the home price.`}
							</>
						)}
					</p>
				</>
			) : (
				<p className="mt-1 text-base text-slate-700">
					Enter a valid home price or annual property tax to see the estimate.
				</p>
			)}
		</div>
	</section>
);

export default PropertyTaxSummary;
