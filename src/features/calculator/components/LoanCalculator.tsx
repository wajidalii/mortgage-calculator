import Card from "@/components/ui/Card";
import { useCalculatorInputs } from "../hooks/useCalculatorInputs";
import DownPaymentFields from "./DownPaymentFields";
import LoanSummary from "./LoanSummary";
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
		propertyTax,
		monthlyCosts,
		pmi,
		estimate,
		schedule,
	} = useCalculatorInputs();
	const { inputs, touched } = state;
	// Show a message only after the user has left the field.
	const shown = (field: keyof typeof touched) =>
		touched[field]
			? (derived.errors[field] ??
				propertyTax.errors[field] ??
				monthlyCosts.errors[field] ??
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
					<TermSelector
						value={inputs.termYears}
						onChange={(years) => dispatch({ type: "setTerm", years })}
					/>
					<TextField
						label="Interest rate"
						suffix="%"
						value={inputs.interestRate}
						error={shown("interestRate")}
						onChange={(value) =>
							dispatch({ type: "edit", field: "interestRate", value })
						}
						onBlur={() => dispatch({ type: "blur", field: "interestRate" })}
					/>
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
			<MonthlyEstimateCard estimate={estimate} />
			<LoanSummary loan={derived.loan} />
			<PropertyTaxSummary tax={propertyTax.tax} />
			<MonthlyCostsSummary costs={monthlyCosts.costs} />
			<PmiSummary result={pmi.result} />
			{schedule ? <ScheduleTable rows={schedule} /> : null}
		</div>
	);
};

export default LoanCalculator;
