import Disclaimer from "@/components/feedback/Disclaimer";
import { formatMoney } from "@/lib/money";
import { formatRate } from "@/lib/rate";
import type { ArmSummary } from "../armSchedule";
import type { EstimateLine, MonthlyEstimate } from "../monthlyEstimate";

interface MonthlyEstimateCardProps {
	estimate: MonthlyEstimate | null;
	/** Set for a valid 5/6 ARM: the estimate shows the first-period payment. */
	arm?: ArmSummary | null;
	/** An illustrative default behind this estimate is past the stale limit. */
	outOfDate?: boolean;
}

const Lines = ({
	lines,
	piLabel,
}: {
	lines: readonly EstimateLine[];
	piLabel?: string | undefined;
}) => (
	<>
		{lines.map((line) => (
			<div key={line.id} className="flex justify-between gap-4 py-1">
				<dt className="text-slate-700">
					{line.id === "pi" && piLabel ? piLabel : line.label}
				</dt>
				<dd className="font-medium text-slate-900">
					{formatMoney(line.amount)}
				</dd>
			</div>
		))}
	</>
);

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
}: MonthlyEstimateCardProps) => (
	<section
		aria-labelledby="monthly-estimate-heading"
		className="rounded-lg bg-brand-50 p-4 sm:p-6 ring-1 ring-brand-500/30"
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
								<Lines
									lines={estimate.lender}
									piLabel={
										arm ? "Principal and interest (months 1–60)" : undefined
									}
								/>
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
					{arm ? <ResetRisk arm={arm} /> : null}
					{outOfDate ? (
						<p className="mt-4 text-sm text-amber-950">
							<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium ring-1 ring-amber-400">
								May be out of date
							</span>{" "}
							Some illustrative defaults behind this estimate are over a year
							old. See the assumptions below.
						</p>
					) : null}
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
