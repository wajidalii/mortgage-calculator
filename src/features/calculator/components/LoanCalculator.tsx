import { useMemo } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SavedScenarios from "@/features/scenarios/components/SavedScenarios";
import type { StorageLike } from "@/features/scenarios/storage";
import { parseCalculatorInputs } from "@/features/scenarios/validate";
import { usePrinting } from "@/hooks/usePrinting";
import { lifetimeInterest } from "@/lib/amortization";
import { hasStaleDefault } from "../assumptions";
import { deriveCostGrowth } from "../costGrowth";
import { useCalculatorInputs } from "../hooks/useCalculatorInputs";
import { buildRateSensitivity } from "../rateSensitivity";
import AffordabilityCard from "./AffordabilityCard";
import AssumptionsPanel from "./AssumptionsPanel";
import BalanceChart from "./BalanceChart";
import CostGrowthTable from "./CostGrowthTable";
import ExtraPaymentsSummary from "./ExtraPaymentsSummary";
import LoanMetrics from "./LoanMetrics";
import MobileSummaryBar from "./MobileSummaryBar";
import MonthlyCostsSummary from "./MonthlyCostsSummary";
import MonthlyEstimateCard from "./MonthlyEstimateCard";
import MortgageInputPanel from "./MortgageInputPanel";
import PmiSummary from "./PmiSummary";
import PrintReport from "./PrintReport";
import PropertyTaxSummary from "./PropertyTaxSummary";
import RateSensitivityTable from "./RateSensitivityTable";
import ScheduleTable from "./ScheduleTable";

interface LoanCalculatorProps {
	/** Fixes "today" for the stale-default check. Defaults to the current date. */
	today?: Date;
	/** Where saved scenarios go. Defaults to the browser's local storage. */
	storage?: StorageLike | null;
}

const LoanCalculator = ({ today, storage }: LoanCalculatorProps) => {
	const {
		state,
		dispatch,
		derived,
		arm,
		propertyTax,
		monthlyCosts,
		pmi,
		closing,
		affordability,
		extra,
		results,
		showingLastResult,
	} = useCalculatorInputs(today);
	const { inputs, touched } = state;
	const printing = usePrinting();
	const printDate = useMemo(() => today ?? new Date(), [today]);
	const growth = useMemo(
		() => deriveCostGrowth(inputs, results.tax, results.costs),
		[inputs, results.tax, results.costs],
	);
	// Fixed-rate only: an ARM has no single rate to vary.
	const sensitivity = useMemo(
		() =>
			results.loan && inputs.loanType === "fixed"
				? buildRateSensitivity(results.loan)
				: null,
		[results.loan, inputs.loanType],
	);
	const isArm = inputs.loanType === "arm";
	// Show a message only after the user has left the field.
	const shown = (field: keyof typeof touched) =>
		touched[field]
			? (derived.errors[field] ??
				propertyTax.errors[field] ??
				monthlyCosts.errors[field] ??
				arm.errors[field as keyof typeof arm.errors] ??
				pmi.errors[field] ??
				closing.errors[field] ??
				affordability.errors[field] ??
				extra.errors[field] ??
				growth.errors[field as keyof typeof growth.errors])
			: undefined;

	const scheduleRows = results.extra?.rows ?? results.schedule;
	const interestTotal = scheduleRows ? lifetimeInterest(scheduleRows) : null;

	// While printing, only the report is shown; the screen UI is hidden in CSS
	// too, so Ctrl+P without a Print click prints the same thing.
	return (
		<>
			{printing ? (
				<div className="hidden print:block">
					<PrintReport inputs={inputs} results={results} date={printDate} />
				</div>
			) : null}
			<div className="grid grid-cols-1 gap-6 pb-20 lg:pb-0 print:hidden">
				<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
					<div className="grid grid-cols-1 gap-6">
						<MortgageInputPanel
							inputs={inputs}
							dispatch={dispatch}
							errorFor={shown}
							pmiRequired={pmi.required}
							closingDollars={closing.dollars}
						/>
						<SavedScenarios
							kind="calculator"
							current={inputs}
							parse={parseCalculatorInputs}
							onOpen={(saved) => dispatch({ type: "load", inputs: saved })}
							{...(storage !== undefined ? { storage } : {})}
						/>
					</div>
					<div
						id="results"
						tabIndex={-1}
						className="results-sticky grid scroll-mt-4 grid-cols-1 gap-4 outline-none"
					>
						{showingLastResult ? (
							<p
								role="status"
								className="rounded-md bg-amber-50 p-3 text-sm font-medium text-amber-950 ring-1 ring-amber-400"
							>
								<span aria-hidden="true">⚠ </span>A field has text that is not a
								number. The results below are from your last valid entry.
							</p>
						) : null}
						<MonthlyEstimateCard
							estimate={results.estimate}
							arm={results.arm?.summary ?? null}
							outOfDate={hasStaleDefault(results.assumptions)}
							stale={showingLastResult}
						/>
						<LoanMetrics
							loan={results.loan}
							closing={results.closing}
							lifetimeInterest={interestTotal}
							isArm={isArm}
						/>
						<div className="mt-1">
							<Button variant="secondary" onClick={() => window.print()}>
								Print report
							</Button>
						</div>
					</div>
				</div>
				{scheduleRows && scheduleRows.length > 0 ? (
					<Card>
						<h2 className="text-lg font-semibold text-slate-900">
							How your balance changes
						</h2>
						<p className="mb-4 text-sm text-slate-600">
							{isArm
								? "Rates after month 60 are hypothetical."
								: "Remaining balance and interest paid over the loan."}
						</p>
						<BalanceChart rows={scheduleRows} />
					</Card>
				) : null}
				{scheduleRows ? <ScheduleTable rows={scheduleRows} /> : null}
				<section
					aria-labelledby="details-heading"
					className="grid grid-cols-1 gap-4"
				>
					<h2
						id="details-heading"
						className="text-lg font-semibold text-slate-900"
					>
						Where these numbers come from
					</h2>
					<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
						<PropertyTaxSummary tax={results.tax} />
						<MonthlyCostsSummary costs={results.costs} />
						<PmiSummary result={results.pmi} />
						<ExtraPaymentsSummary extra={results.extra} />
						<CostGrowthTable growth={growth.result} />
						<RateSensitivityTable rows={sensitivity} />
						<AffordabilityCard affordability={results.affordability} />
					</div>
				</section>
				<AssumptionsPanel items={results.assumptions} />
			</div>
			<MobileSummaryBar
				total={results.estimate?.total ?? null}
				targetId="results"
				stale={showingLastResult}
			/>
		</>
	);
};

export default LoanCalculator;
