import Card from "@/components/ui/Card";
import { useCalculatorInputs } from "../hooks/useCalculatorInputs";
import ArmFields from "./ArmFields";
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

const LoanCalculator = () => {
	const {
		state,
		dispatch,
		derived,
		loan,
		arm,
		propertyTax,
		monthlyCosts,
		pmi,
		estimate,
		schedule,
	} = useCalculatorInputs();
	const { inputs, touched } = state;
	const isArm = inputs.loanType === "arm";
	// Show a message only after the user has left the field.
	const shown = (field: keyof typeof touched) =>
		touched[field]
			? (derived.errors[field] ??
				propertyTax.errors[field] ??
				monthlyCosts.errors[field] ??
				arm.errors[field as keyof typeof arm.errors] ??
				pmi.errors[field])
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
				</form>
			</Card>
			<MonthlyEstimateCard
				estimate={estimate}
				arm={arm.result?.summary ?? null}
			/>
			<LoanSummary loan={loan} />
			<PropertyTaxSummary tax={propertyTax.tax} />
			<MonthlyCostsSummary costs={monthlyCosts.costs} />
			<PmiSummary result={pmi.result} />
			{schedule ? <ScheduleTable rows={schedule} /> : null}
		</div>
	);
};

export default LoanCalculator;
