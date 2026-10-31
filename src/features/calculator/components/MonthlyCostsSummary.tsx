import { formatMoney } from "@/lib/money";
import type { MonthlyCosts } from "../monthlyCosts";

interface MonthlyCostsSummaryProps {
	costs: MonthlyCosts | null;
}

const Row = ({
	label,
	value,
	note,
}: {
	label: string;
	value: string;
	note?: string;
}) => (
	<div>
		<dt className="text-slate-600">{label}</dt>
		<dd className="mt-0.5 text-lg font-semibold text-slate-900">{value}</dd>
		{note ? <dd className="text-xs text-slate-600">{note}</dd> : null}
	</div>
);

const MonthlyCostsSummary = ({ costs }: MonthlyCostsSummaryProps) => (
	<section
		aria-labelledby="monthly-costs-heading"
		className="py-5 first:pt-0 last:pb-0"
	>
		<h3
			id="monthly-costs-heading"
			className="text-sm font-semibold text-slate-900"
		>
			Insurance, HOA and other monthly costs
		</h3>
		<div aria-live="polite">
			{costs ? (
				<div className="mt-3 grid gap-5 text-sm sm:grid-cols-2">
					<div>
						<h4 className="font-medium text-slate-800">
							Lender payment (escrow)
						</h4>
						<dl className="mt-2 grid gap-3">
							<Row
								label="Homeowners insurance"
								value={formatMoney(costs.monthlyInsurance)}
								note={
									costs.insuranceIsDefault
										? "Illustrative estimate, not a quote."
										: "Your estimate, not a quote."
								}
							/>
						</dl>
					</div>
					<div>
						<h4 className="font-medium text-slate-800">Non-escrow</h4>
						<dl className="mt-2 grid gap-3">
							<Row label="HOA" value={formatMoney(costs.monthlyHoa)} />
							<Row
								label="Other monthly cost"
								value={formatMoney(costs.monthlyOther)}
							/>
						</dl>
					</div>
				</div>
			) : (
				<p className="mt-1 text-base text-slate-700">
					Fix the highlighted fields to see these costs.
				</p>
			)}
		</div>
	</section>
);

export default MonthlyCostsSummary;
