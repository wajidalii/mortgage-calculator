import Disclaimer from "@/components/feedback/Disclaimer";
import { formatMoney } from "@/lib/money";
import { formatRate } from "@/lib/rate";
import type { ArmSummary } from "../armSchedule";
import type { MonthlyEstimate } from "../monthlyEstimate";
import PaymentBreakdown from "./PaymentBreakdown";

interface MonthlyEstimateCardProps {
	estimate: MonthlyEstimate | null;
	/** Set for a valid 5/6 ARM: the estimate shows the first-period payment. */
	arm?: ArmSummary | null;
	/** An illustrative default behind this estimate is past the stale limit. */
	outOfDate?: boolean;
	/** The numbers are from the last valid entry, not the fields as typed. */
	stale?: boolean;
}

const ResetRisk = ({ arm }: { arm: ArmSummary }) => (
	<div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-400">
		<p className="font-semibold">
			Reset risk: this payment is for months 1 to 60
		</p>
		{arm.rises ? (
			<p className="mt-1">
				After month 60 the rate resets every 6 months. With the{" "}
				{arm.presetLabel.toLowerCase()} index path, principal and interest
				reaches {formatMoney(arm.peakPayment)} a month by month {arm.peakMonth}{" "}
				(rate up to {formatRate(arm.peakRate)}).{" "}
				<span className="whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium ring-1 ring-amber-400">
					Hypothetical rate
				</span>
			</p>
		) : (
			<p className="mt-1">
				After month 60 the rate resets every 6 months. With the{" "}
				{arm.presetLabel.toLowerCase()} index path, principal and interest does
				not go above {formatMoney(arm.firstPayment)}, but a different index
				could raise it.{" "}
				<span className="whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium ring-1 ring-amber-400">
					Hypothetical rate
				</span>
			</p>
		)}
	</div>
);

const MonthlyEstimateCard = ({
	estimate,
	arm,
	outOfDate = false,
	stale = false,
}: MonthlyEstimateCardProps) => (
	<section
		aria-labelledby="monthly-estimate-heading"
		className="rounded-2xl bg-brand-900 p-4 text-white shadow-sm sm:p-6"
	>
		<div className="flex flex-wrap items-start justify-between gap-2">
			<h2
				id="monthly-estimate-heading"
				className="text-xs font-bold uppercase tracking-widest text-brand-100"
			>
				Estimated monthly cost
			</h2>
			{stale ? (
				<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">
					<span aria-hidden="true">⚠ </span>Last valid entry
				</span>
			) : (
				<span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-brand-50">
					Live estimate
				</span>
			)}
		</div>
		<div aria-live="polite">
			{estimate ? (
				<>
					<p className="mt-2 text-5xl font-extrabold tracking-tight tabular-nums">
						{formatMoney(estimate.total)}
						<span className="ml-1 whitespace-nowrap text-base font-normal text-brand-100">
							/ month total
						</span>
					</p>
					<p className="mt-1 text-sm text-brand-100">
						Principal, interest, tax, insurance and other ownership costs
					</p>
					<div className="mt-5 rounded-xl bg-white p-4 text-slate-900">
						<PaymentBreakdown
							estimate={estimate}
							piLabel={arm ? "Principal and interest (months 1–60)" : undefined}
						/>
					</div>
					{arm ? <ResetRisk arm={arm} /> : null}
					{outOfDate ? (
						<p className="mt-4 text-sm">
							<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-950 ring-1 ring-amber-400">
								May be out of date
							</span>{" "}
							Some illustrative defaults behind this estimate are over a year
							old. See the assumptions below.
						</p>
					) : null}
				</>
			) : (
				<p className="mt-2 text-base text-brand-50">
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
