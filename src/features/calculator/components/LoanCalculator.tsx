import Card from "@/components/ui/Card";
import { hasStaleDefault } from "../assumptions";
import { useCalculatorInputs } from "../hooks/useCalculatorInputs";
import ArmFields from "./ArmFields";
import AssumptionsPanel from "./AssumptionsPanel";
import CashToCloseCard from "./CashToCloseCard";
import ClosingCostsFields from "./ClosingCostsFields";
import DownPaymentFields from "./DownPaymentFields";
import LoanSummary from "./LoanSummary";
import LoanTypeSelector from "./LoanTypeSelector";
import MonthlyCostsFields from "./MonthlyCostsFields";
import MonthlyCostsSummary from "./MonthlyCostsSummary";
import MonthlyEstimateCard from "./MonthlyEstimateCard";
import PmiFields from "./PmiFields";
import PmiSummary from "./PmiSummary";
import PropertyTaxFields from "./PropertyTaxFields";
import PropertyTaxSummary from "./PropertyTaxSummary";
import ScheduleTable from "./ScheduleTable";
import TermSelector from "./TermSelector";
import TextField from "./TextField";

interface LoanCalculatorProps {
	/** Fixes "today" for the stale-default check. Defaults to the current date. */
	today?: Date;
}

const LoanCalculator = ({ today }: LoanCalculatorProps) => {
	const {
		state,
		dispatch,
		derived,
		arm,
		propertyTax,
		monthlyCosts,
		pmi,
		closing,
		results,
		showingLastResult,
	} = useCalculatorInputs(today);
	const { inputs, touched } = state;
	const isArm = inputs.loanType === "arm";
	// Show a message only after the user has left the field.
	const shown = (field: keyof typeof touched) =>
		touched[field]
			? (derived.errors[field] ??
				propertyTax.errors[field] ??
				monthlyCosts.errors[field] ??
				arm.errors[field as keyof typeof arm.errors] ??
				pmi.errors[field] ??
				closing.errors[field])
			: undefined;

	return (
		<div className="grid gap-6">
			<Card>
				<form
					noValidate
					onSubmit={(event) => event.preventDefault()}
					className="grid gap-5 sm:grid-cols-2"
				>
					<TextField
						className="sm:col-span-2"
						label="Home price"
						prefix="$"
						value={inputs.homePrice}
						error={shown("homePrice")}
						onChange={(value) =>
							dispatch({ type: "edit", field: "homePrice", value })
						}
						onBlur={() => dispatch({ type: "blur", field: "homePrice" })}
					/>
					<DownPaymentFields
						mode={inputs.downPaymentMode}
						percent={inputs.downPaymentPercent}
						amount={inputs.downPaymentAmount}
						error={shown("downPayment")}
						onModeChange={(mode) =>
							dispatch({ type: "setDownPaymentMode", mode })
						}
						onPercentChange={(value) =>
							dispatch({ type: "edit", field: "downPaymentPercent", value })
						}
						onAmountChange={(value) =>
							dispatch({ type: "edit", field: "downPaymentAmount", value })
						}
						onBlur={(field) => dispatch({ type: "blur", field })}
					/>
					<LoanTypeSelector
						value={inputs.loanType}
						onChange={(loanType) => dispatch({ type: "setLoanType", loanType })}
					/>
					<TermSelector
						value={inputs.termYears}
						onChange={(years) => dispatch({ type: "setTerm", years })}
					/>
					<TextField
						label={isArm ? "Start rate" : "Interest rate"}
						suffix="%"
						value={inputs.interestRate}
						error={shown("interestRate")}
						onChange={(value) =>
							dispatch({ type: "edit", field: "interestRate", value })
						}
						onBlur={() => dispatch({ type: "blur", field: "interestRate" })}
						{...(isArm
							? { hint: "The rate for months 1 to 60 (the fixed period)." }
							: {})}
					/>
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
					<PropertyTaxFields
						state={inputs.state}
						override={inputs.annualTaxOverride}
						error={shown("annualTaxOverride")}
						onStateChange={(value) =>
							dispatch({ type: "setState", state: value })
						}
						onOverrideChange={(value) =>
							dispatch({ type: "edit", field: "annualTaxOverride", value })
						}
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
						onRateChange={(value) =>
							dispatch({ type: "edit", field: "pmiRate", value })
						}
						onBlur={() => dispatch({ type: "blur", field: "pmiRate" })}
					/>
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
						onBlur={(line) => dispatch({ type: "blurClosingLine", line })}
						onCreditsChange={(value) =>
							dispatch({ type: "edit", field: "closingCredits", value })
						}
						onCreditsBlur={() =>
							dispatch({ type: "blur", field: "closingCredits" })
						}
					/>
				</form>
			</Card>
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
			/>
			<CashToCloseCard closing={results.closing} />
			<LoanSummary loan={results.loan} />
			<PropertyTaxSummary tax={results.tax} />
			<MonthlyCostsSummary costs={results.costs} />
			<PmiSummary result={results.pmi} />
			<AssumptionsPanel items={results.assumptions} />
			{results.schedule ? <ScheduleTable rows={results.schedule} /> : null}
		</div>
	);
};

export default LoanCalculator;
