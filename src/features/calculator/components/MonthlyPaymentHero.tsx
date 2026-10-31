import Disclaimer from "@/components/feedback/Disclaimer";
import { useValueFlash } from "@/hooks/useValueFlash";
import { formatMoney } from "@/lib/money";
import { formatRate } from "@/lib/rate";
import type { ArmSummary } from "../armSchedule";
import type { MonthlyEstimate } from "../monthlyEstimate";
import PaymentBreakdown from "./PaymentBreakdown";

interface MonthlyPaymentHeroProps {
	estimate: MonthlyEstimate | null;
	/** Set for a valid 5/6 ARM: the estimate shows the first-period payment. */
	arm?: ArmSummary | null;
	/** An illustrative default behind this estimate is past the stale limit. */
	outOfDate?: boolean;
	/** The figures are the last valid result, not the current inputs. */
	stale?: boolean;
}

const HYPOTHETICAL =
	"whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-400";

const ResetRisk = ({ arm }: { arm: ArmSummary }) => (
	<div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 ring-1 ring-amber-400">
		<p className="font-semibold">
			Reset risk: this payment is for months 1 to 60
		</p>
		{arm.rises ? (
			<p className="mt-1">
				After month 60 the rate resets every 6 months. With the{" "}
				{arm.presetLabel.toLowerCase()} index path, principal and interest
				reaches {formatMoney(arm.peakPayment)} a month by month {arm.peakMonth}{" "}
				(rate up to {formatRate(arm.peakRate)}).{" "}
				<span className={HYPOTHETICAL}>Hypothetical rate</span>
			</p>
		) : (
			<p className="mt-1">
				After month 60 the rate resets every 6 months. With the{" "}
				{arm.presetLabel.toLowerCase()} index path, principal and interest does
				not go above {formatMoney(arm.firstPayment)}, but a different index
				could raise it. <span className={HYPOTHETICAL}>Hypothetical rate</span>
			</p>
		)}
	</div>
);

const StatusPill = ({ stale, arm }: { stale: boolean; arm: boolean }) =>
	stale ? (
		<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950">
			<span aria-hidden="true">⚠ </span>Last valid entry
		</span>
	) : (
		<span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">
			{arm ? "Months 1 to 60" : "Live estimate"}
		</span>
	);

/**
 * The primary result: total monthly ownership cost, then the itemized lender
 * (escrow) and non-escrow lines, ARM reset risk and the disclaimer.
 */
const MonthlyPaymentHero = ({
	estimate,
	arm,
	outOfDate = false,
	stale = false,
}: MonthlyPaymentHeroProps) => {
	// Highlight a newly calculated total, never a stale one.
	const flash = useValueFlash(estimate?.total ?? null, !stale);
	return (
		<section
			aria-labelledby="monthly-estimate-heading"
			className="overflow-hidden rounded-2xl bg-linear-135 from-brand-900 to-brand-800 p-1.5 text-white shadow-panel sm:p-2"
		>
			<div className="px-4 pt-4 pb-5 sm:px-5 sm:pt-5">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<h2
						id="monthly-estimate-heading"
						className="text-xs font-bold tracking-widest text-brand-100 uppercase"
					>
						Estimated monthly cost
					</h2>
					{estimate ? <StatusPill stale={stale} arm={Boolean(arm)} /> : null}
				</div>
				<div aria-live="polite">
					{estimate ? (
						<>
							<p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
								<span
									key={flash}
									className={
										flash > 0
											? "-mx-1.5 rounded-lg px-1.5 [--flash-color:rgb(255_255_255/0.22)] motion-safe:animate-flash"
											: undefined
									}
								>
									{formatMoney(estimate.total)}
								</span>
								<span className="ml-2 text-base font-medium tracking-normal text-brand-100">
									/ month total
								</span>
							</p>
							<p className="mt-1 text-sm text-brand-100">
								Principal, interest, taxes, insurance and other ownership costs
							</p>
						</>
					) : (
						<p className="mt-2 text-base text-white">
							Fix the highlighted fields to see the itemized monthly estimate.
						</p>
					)}
				</div>
			</div>
			<div className="rounded-xl bg-white p-4 text-slate-900 sm:p-5">
				{estimate ? (
					<>
						<PaymentBreakdown
							estimate={estimate}
							piLabel={arm ? "Principal and interest (months 1–60)" : undefined}
						/>
						{arm ? <ResetRisk arm={arm} /> : null}
						{outOfDate ? (
							<p className="mt-4 text-sm text-amber-950">
								<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold ring-1 ring-amber-400">
									May be out of date
								</span>{" "}
								Some illustrative defaults behind this estimate are over a year
								old. See the assumptions below.
							</p>
						) : null}
					</>
				) : null}
				<div className={estimate ? "mt-5" : undefined}>
					<Disclaimer />
				</div>
			</div>
		</section>
	);
};

export default MonthlyPaymentHero;
