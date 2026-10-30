import Disclaimer from "@/components/feedback/Disclaimer";
import { formatMoney } from "@/lib/money";
import type { EstimateLine, MonthlyEstimate } from "../monthlyEstimate";

interface MonthlyEstimateCardProps {
	estimate: MonthlyEstimate | null;
}

const Lines = ({ lines }: { lines: readonly EstimateLine[] }) => (
	<>
		{lines.map((line) => (
			<div key={line.id} className="flex justify-between gap-4 py-1">
				<dt className="text-slate-700">{line.label}</dt>
				<dd className="font-medium text-slate-900">
					{formatMoney(line.amount)}
				</dd>
			</div>
		))}
	</>
);

const MonthlyEstimateCard = ({ estimate }: MonthlyEstimateCardProps) => (
	<section
		aria-labelledby="monthly-estimate-heading"
		className="rounded-lg bg-brand-50 p-6 ring-1 ring-brand-500/30"
	>
		<h2
			id="monthly-estimate-heading"
			className="text-sm font-medium text-slate-700"
		>
			Estimated monthly cost
		</h2>
		<div aria-live="polite">
			{estimate ? (
				<>
					<p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
						{formatMoney(estimate.total)}
						<span className="ml-1 text-base font-normal text-slate-600">
							/ month total
						</span>
					</p>
					<div className="mt-4 grid gap-5 border-t border-slate-300/60 pt-4 text-sm sm:grid-cols-2">
						<div>
							<h3 className="font-semibold text-slate-800">
								Lender payment (escrow)
							</h3>
							<dl className="mt-1">
								<Lines lines={estimate.lender} />
								<div className="mt-1 flex justify-between gap-4 border-t border-slate-300 pt-2">
									<dt className="font-semibold text-slate-800">
										Lender payment
									</dt>
									<dd className="font-semibold text-slate-900">
										{formatMoney(estimate.lenderPayment)}
									</dd>
								</div>
							</dl>
						</div>
						<div>
							<h3 className="font-semibold text-slate-800">Non-escrow</h3>
							<dl className="mt-1">
								<Lines lines={estimate.nonEscrow} />
								<div className="mt-1 flex justify-between gap-4 border-t border-slate-300 pt-2">
									<dt className="font-semibold text-slate-800">
										Non-escrow total
									</dt>
									<dd className="font-semibold text-slate-900">
										{formatMoney(estimate.nonEscrowTotal)}
									</dd>
								</div>
							</dl>
						</div>
					</div>
				</>
			) : (
				<p className="mt-1 text-base text-slate-700">
					Fix the highlighted fields to see the itemized monthly estimate.
				</p>
			)}
		</div>
		<div className="mt-4">
			<Disclaimer />
		</div>
	</section>
);

export default MonthlyEstimateCard;
