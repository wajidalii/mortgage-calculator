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
		className="rounded-lg bg-white p-6 ring-1 ring-slate-300"
	>
		<h2
			id="monthly-costs-heading"
			className="text-sm font-medium text-slate-700"
		>
			Insurance, HOA and other monthly costs
		</h2>
		<div aria-live="polite">
			{costs ? (
				<div className="mt-3 grid gap-5 text-sm sm:grid-cols-2">
					<div>
						<h3 className="font-medium text-slate-800">
							Lender payment (escrow)
						</h3>
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
						<h3 className="font-medium text-slate-800">Non-escrow</h3>
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
