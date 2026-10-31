import { useMemo, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SavedScenarios from "@/features/scenarios/components/SavedScenarios";
import type { StorageLike } from "@/features/scenarios/storage";
import { parseCalculatorInputs } from "@/features/scenarios/validate";
import { useFitsViewport } from "@/hooks/useFitsViewport";
import { useInView } from "@/hooks/useInView";
import { usePrinting } from "@/hooks/usePrinting";
import { cn } from "@/lib/cn";
import { hasStaleDefault } from "../assumptions";
import { deriveCostGrowth } from "../costGrowth";
import { useCalculatorInputs } from "../hooks/useCalculatorInputs";
import { buildRateSensitivity } from "../rateSensitivity";
import type { EditableField, ErrorField } from "../types";
import AdvancedSection from "./AdvancedSection";
import AffordabilityCard from "./AffordabilityCard";
import AffordabilityFields from "./AffordabilityFields";
import ArmFields from "./ArmFields";
import AssumptionsPanel from "./AssumptionsPanel";
import BalanceChart from "./BalanceChart";
import CashToCloseCard from "./CashToCloseCard";
import ClosingCostsFields from "./ClosingCostsFields";
import CostGrowthFields from "./CostGrowthFields";
import CostGrowthTable from "./CostGrowthTable";
import DownPaymentFields from "./DownPaymentFields";
import ExtraPaymentFields from "./ExtraPaymentFields";
import ExtraPaymentsSummary from "./ExtraPaymentsSummary";
import LoanMetrics from "./LoanMetrics";
import LoanTypeSelector from "./LoanTypeSelector";
import MobileSummaryBar from "./MobileSummaryBar";
import MonthlyCostsFields from "./MonthlyCostsFields";
import MonthlyCostsSummary from "./MonthlyCostsSummary";
import MonthlyPaymentHero from "./MonthlyPaymentHero";
import PmiFields from "./PmiFields";
import PmiSummary from "./PmiSummary";
import PrintReport from "./PrintReport";
import PropertyTaxFields from "./PropertyTaxFields";
import PropertyTaxSummary from "./PropertyTaxSummary";
import RateSensitivityTable from "./RateSensitivityTable";
import ScheduleTable from "./ScheduleTable";
import TermSelector from "./TermSelector";
import TextField from "./TextField";

interface LoanCalculatorProps {
	/** Fixes "today" for the stale-default check. Defaults to the current date. */
	today?: Date;
	/** Where saved scenarios go. Defaults to the browser's local storage. */
	storage?: StorageLike | null;
}

/** The fields inside each collapsible section, for its error count. */
const SECTION_FIELDS = {
	costs: [
		"annualTaxOverride",
		"annualInsurance",
		"extraAnnualInsurance",
		"monthlyHoa",
		"monthlyOther",
		"pmiRate",
	],
	closing: [
		"closing:lender",
		"closing:title",
		"closing:prepaids",
		"closing:other",
		"closingCredits",
	],
	extra: ["extraMonthly", "lumpSum", "lumpMonth"],
	growth: ["taxGrowth", "insuranceGrowth"],
	affordability: [
		"grossMonthlyIncome",
		"otherMonthlyDebt",
		"dtiFrontEnd",
		"dtiBackEnd",
	],
} satisfies Record<string, ErrorField[]>;

const RESULTS_ID = "calculator-results";

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

	const errorCount = (fields: readonly ErrorField[]) =>
		fields.filter((field) => shown(field) !== undefined).length;
	const rows = results.extra?.rows ?? results.schedule;
	const heroRef = useRef<HTMLDivElement>(null);
	const heroInView = useInView(heroRef);
	const resultsRef = useRef<HTMLDivElement>(null);
	// Sticky beside the inputs only when the whole column fits on screen.
	const resultsFit = useFitsViewport(resultsRef, 48);
	const edit = (field: EditableField) => (value: string) =>
		dispatch({ type: "edit", field, value });

	// While printing, only the report is shown; the screen UI is hidden in CSS
	// too, so Ctrl+P without a Print click prints the same thing.
	return (
		<>
			{printing ? (
				<div className="hidden print:block">
					<PrintReport inputs={inputs} results={results} date={printDate} />
				</div>
			) : null}
			<div className="grid grid-cols-1 gap-6 pb-24 sm:pb-0 lg:gap-8 print:hidden">
				<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:gap-8">
					<div className="grid min-w-0 grid-cols-1 gap-6">
						<Card className="sm:p-7">
							<h2 className="text-lg font-semibold text-slate-900">
								Your mortgage details
							</h2>
							<p className="mt-1 text-sm text-slate-600">
								Optional fields left blank use illustrative defaults. Results
								label every default so you can tell it from your own numbers.
							</p>
							<form
								noValidate
								onSubmit={(event) => event.preventDefault()}
								className="mt-6"
							>
								<div className="grid gap-5 sm:grid-cols-2">
									<TextField
										className="sm:col-span-2"
										label="Home price"
										prefix="$"
										value={inputs.homePrice}
										error={shown("homePrice")}
										onChange={edit("homePrice")}
										onBlur={() =>
											dispatch({ type: "blur", field: "homePrice" })
										}
									/>
									<DownPaymentFields
										mode={inputs.downPaymentMode}
										percent={inputs.downPaymentPercent}
										amount={inputs.downPaymentAmount}
										error={shown("downPayment")}
										onModeChange={(mode) =>
											dispatch({ type: "setDownPaymentMode", mode })
										}
										onPercentChange={edit("downPaymentPercent")}
										onAmountChange={edit("downPaymentAmount")}
										onBlur={(field) => dispatch({ type: "blur", field })}
									/>
									<TextField
										label={isArm ? "Start rate" : "Interest rate"}
										suffix="%"
										value={inputs.interestRate}
										error={shown("interestRate")}
										onChange={edit("interestRate")}
										onBlur={() =>
											dispatch({ type: "blur", field: "interestRate" })
										}
										{...(isArm
											? {
													hint: "The rate for months 1 to 60 (the fixed period).",
												}
											: {})}
									/>
									<LoanTypeSelector
										value={inputs.loanType}
										onChange={(loanType) =>
											dispatch({ type: "setLoanType", loanType })
										}
									/>
									<div className="sm:col-span-2">
										<TermSelector
											value={inputs.termYears}
											onChange={(years) => dispatch({ type: "setTerm", years })}
										/>
									</div>
									{isArm ? (
										<ArmFields
											margin={inputs.armMargin}
											floor={inputs.armFloor}
											initialCap={inputs.armInitialCap}
											periodicCap={inputs.armPeriodicCap}
											lifetimeCap={inputs.armLifetimeCap}
											preset={inputs.armIndexPreset}
											errorFor={shown}
											onChange={(field, value) =>
												dispatch({ type: "edit", field, value })
											}
											onBlur={(field) => dispatch({ type: "blur", field })}
											onPresetChange={(preset) =>
												dispatch({ type: "setArmIndexPreset", preset })
											}
										/>
									) : null}
								</div>
								<div className="mt-6 border-b border-slate-200">
									<AdvancedSection
										title="Taxes, insurance and HOA"
										description="Property tax, insurance, HOA, other costs and PMI"
										errorCount={errorCount(SECTION_FIELDS.costs)}
										defaultOpen
									>
										<PropertyTaxFields
											state={inputs.state}
											override={inputs.annualTaxOverride}
											error={shown("annualTaxOverride")}
											onStateChange={(value) =>
												dispatch({ type: "setState", state: value })
											}
											onOverrideChange={edit("annualTaxOverride")}
											onBlur={() =>
												dispatch({ type: "blur", field: "annualTaxOverride" })
											}
										/>
										<MonthlyCostsFields
											values={inputs}
											errorFor={shown}
											onChange={(field, value) =>
												dispatch({ type: "edit", field, value })
											}
											onBlur={(field) => dispatch({ type: "blur", field })}
										/>
										<PmiFields
											required={pmi.required}
											on={inputs.pmiOn}
											rate={inputs.pmiRate}
											error={shown("pmiRate")}
											onToggle={(on) => dispatch({ type: "setPmiOn", on })}
											onRateChange={edit("pmiRate")}
											onBlur={() =>
												dispatch({ type: "blur", field: "pmiRate" })
											}
										/>
									</AdvancedSection>
									<AdvancedSection
										title="Closing costs and credits"
										description="Fees and prepaids from your Loan Estimate"
										errorCount={errorCount(SECTION_FIELDS.closing)}
									>
										<ClosingCostsFields
											closing={inputs.closing}
											credits={inputs.closingCredits}
											dollars={closing.dollars}
											errorFor={shown}
											onValueChange={(line, value) =>
												dispatch({ type: "editClosingLine", line, value })
											}
											onModeChange={(line, mode) =>
												dispatch({ type: "setClosingMode", line, mode })
											}
											onBlur={(line) =>
												dispatch({ type: "blurClosingLine", line })
											}
											onCreditsChange={edit("closingCredits")}
											onCreditsBlur={() =>
												dispatch({ type: "blur", field: "closingCredits" })
											}
										/>
									</AdvancedSection>
									<AdvancedSection
										title="Extra principal payments"
										description="Monthly extra or a one-time lump sum"
										errorCount={errorCount(SECTION_FIELDS.extra)}
									>
										<ExtraPaymentFields
											values={inputs}
											errorFor={shown}
											onChange={(field, value) =>
												dispatch({ type: "edit", field, value })
											}
											onBlur={(field) => dispatch({ type: "blur", field })}
										/>
									</AdvancedSection>
									<AdvancedSection
										title="Cost growth over time"
										description="Yearly increases for property tax and insurance"
										errorCount={errorCount(SECTION_FIELDS.growth)}
									>
										<CostGrowthFields
											values={inputs}
											errorFor={shown}
											onChange={(field, value) =>
												dispatch({ type: "edit", field, value })
											}
											onBlur={(field) => dispatch({ type: "blur", field })}
										/>
									</AdvancedSection>
									<AdvancedSection
										title="Affordability check"
										description="Income and debts for debt-to-income ratios"
										errorCount={errorCount(SECTION_FIELDS.affordability)}
									>
										<AffordabilityFields
											values={inputs}
											errorFor={shown}
											onChange={(field, value) =>
												dispatch({ type: "edit", field, value })
											}
											onBlur={(field) => dispatch({ type: "blur", field })}
										/>
									</AdvancedSection>
								</div>
							</form>
						</Card>
						<SavedScenarios
							kind="calculator"
							current={inputs}
							parse={parseCalculatorInputs}
							onOpen={(saved) => dispatch({ type: "load", inputs: saved })}
							{...(storage !== undefined ? { storage } : {})}
						/>
					</div>
					<div
						id={RESULTS_ID}
						ref={resultsRef}
						tabIndex={-1}
						className={cn(
							"grid min-w-0 grid-cols-1 scroll-mt-4 gap-4 outline-none",
							resultsFit && "lg:sticky lg:top-6",
						)}
					>
						{showingLastResult ? (
							<p
								role="status"
								className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-950 ring-1 ring-amber-400"
							>
								<span aria-hidden="true">⚠ </span>A field has text that is not a
								number. The results below are from your last valid entry.
							</p>
						) : null}
						<div ref={heroRef}>
							<MonthlyPaymentHero
								estimate={results.estimate}
								arm={results.arm?.summary ?? null}
								outOfDate={hasStaleDefault(results.assumptions)}
								stale={showingLastResult}
							/>
						</div>
						<LoanMetrics
							loan={results.loan}
							closing={results.closing}
							rows={rows}
							isArm={results.arm !== null}
						/>
						<ExtraPaymentsSummary extra={results.extra} />
					</div>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
					<p className="text-sm text-slate-600">
						The details behind your estimate. A printable report includes your
						inputs and every assumption.
					</p>
					<Button variant="secondary" onClick={() => window.print()}>
						Print report
					</Button>
				</div>
				<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 xl:gap-8">
					{results.loan && rows && rows.length > 0 ? (
						<BalanceChart
							rows={rows}
							baseRows={results.extra ? results.schedule : null}
							loanAmount={results.loan.loanAmount}
							hypotheticalAfter={results.arm ? 60 : null}
						/>
					) : null}
					{rows ? <ScheduleTable rows={rows} /> : null}
					<Card>
						<h2 className="text-lg font-semibold text-slate-900">
							Where these numbers come from
						</h2>
						<p className="mt-1 text-sm text-slate-600">
							Each estimate says whether it uses your entry or an illustrative
							default.
						</p>
						<div className="mt-5 divide-y divide-slate-200 border-t border-slate-200 pt-5">
							<PropertyTaxSummary tax={results.tax} />
							<MonthlyCostsSummary costs={results.costs} />
							<PmiSummary result={results.pmi} />
						</div>
					</Card>
					<div className="grid min-w-0 grid-cols-1 gap-6 xl:gap-8">
						<CashToCloseCard closing={results.closing} />
						<RateSensitivityTable rows={sensitivity} />
					</div>
					<AffordabilityCard affordability={results.affordability} />
					<CostGrowthTable growth={growth.result} />
				</div>
				<AssumptionsPanel items={results.assumptions} />
			</div>
			<MobileSummaryBar
				total={results.estimate?.total ?? null}
				stale={showingLastResult}
				targetId={RESULTS_ID}
				hidden={heroInView}
			/>
		</>
	);
};

export default LoanCalculator;
