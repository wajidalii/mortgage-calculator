import type { Dispatch } from "react";
import Card from "@/components/ui/Card";
import Collapsible from "@/components/ui/Collapsible";
import type { Cents } from "@/types/units";
import type {
	CalculatorAction,
	CalculatorInputs,
	ClosingLineId,
	ErrorField,
} from "../types";
import AffordabilityFields from "./AffordabilityFields";
import ArmFields from "./ArmFields";
import ClosingCostsFields from "./ClosingCostsFields";
import CostGrowthFields from "./CostGrowthFields";
import DownPaymentFields from "./DownPaymentFields";
import ExtraPaymentFields from "./ExtraPaymentFields";
import LoanTypeSelector from "./LoanTypeSelector";
import MonthlyCostsFields from "./MonthlyCostsFields";
import PmiFields from "./PmiFields";
import PropertyTaxFields from "./PropertyTaxFields";
import TermSelector from "./TermSelector";
import TextField from "./TextField";

interface MortgageInputPanelProps {
	inputs: CalculatorInputs;
	dispatch: Dispatch<CalculatorAction>;
	/** The message to show for a field, once the user has left it. */
	errorFor: (field: ErrorField) => string | undefined;
	pmiRequired: boolean;
	closingDollars: Partial<Record<ClosingLineId, Cents>>;
}

const TAX_FIELDS: ErrorField[] = [
	"annualTaxOverride",
	"annualInsurance",
	"extraAnnualInsurance",
	"monthlyHoa",
	"monthlyOther",
	"pmiRate",
];
const CLOSING_FIELDS: ErrorField[] = [
	"closing:lender",
	"closing:title",
	"closing:prepaids",
	"closing:other",
	"closingCredits",
];
const EXTRA_FIELDS: ErrorField[] = ["extraMonthly", "lumpSum", "lumpMonth"];
const GROWTH_FIELDS: ErrorField[] = ["taxGrowth", "insuranceGrowth"];
const AFFORDABILITY_FIELDS: ErrorField[] = [
	"grossMonthlyIncome",
	"otherMonthlyDebt",
	"dtiFrontEnd",
	"dtiBackEnd",
];

const MortgageInputPanel = ({
	inputs,
	dispatch,
	errorFor,
	pmiRequired,
	closingDollars,
}: MortgageInputPanelProps) => {
	const isArm = inputs.loanType === "arm";
	const hasError = (fields: readonly ErrorField[]) =>
		fields.some((field) => errorFor(field) !== undefined);

	return (
		<Card className="@container">
			<h2 className="text-lg font-semibold text-slate-900">
				Your mortgage details
			</h2>
			<p className="mt-1 text-sm text-slate-600">
				Adjust the numbers to explore your options. Results update as you type.
			</p>
			<form noValidate onSubmit={(event) => event.preventDefault()}>
				<div className="mt-5 grid grid-cols-1 gap-5 @md:grid-cols-2">
					<TextField
						className="@md:col-span-2"
						label="Home price"
						prefix="$"
						value={inputs.homePrice}
						error={errorFor("homePrice")}
						onChange={(value) =>
							dispatch({ type: "edit", field: "homePrice", value })
						}
						onBlur={() => dispatch({ type: "blur", field: "homePrice" })}
					/>
					<DownPaymentFields
						mode={inputs.downPaymentMode}
						percent={inputs.downPaymentPercent}
						amount={inputs.downPaymentAmount}
						error={errorFor("downPayment")}
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
					<div className="@md:col-span-2">
						<LoanTypeSelector
							value={inputs.loanType}
							onChange={(loanType) =>
								dispatch({ type: "setLoanType", loanType })
							}
						/>
					</div>
					<div className="@md:col-span-2">
						<TermSelector
							value={inputs.termYears}
							onChange={(years) => dispatch({ type: "setTerm", years })}
						/>
					</div>
					<TextField
						className="@md:col-span-2"
						label={isArm ? "Start rate" : "Interest rate"}
						suffix="%"
						value={inputs.interestRate}
						error={errorFor("interestRate")}
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
							errorFor={errorFor}
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
				<div className="mt-6">
					<Collapsible
						title="Taxes, insurance and HOA"
						caption="Monthly ownership costs beyond the loan"
						defaultOpen
						invalid={hasError(TAX_FIELDS)}
					>
						<PropertyTaxFields
							state={inputs.state}
							override={inputs.annualTaxOverride}
							error={errorFor("annualTaxOverride")}
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
							errorFor={errorFor}
							onChange={(field, value) =>
								dispatch({ type: "edit", field, value })
							}
							onBlur={(field) => dispatch({ type: "blur", field })}
						/>
						<PmiFields
							required={pmiRequired}
							on={inputs.pmiOn}
							rate={inputs.pmiRate}
							error={errorFor("pmiRate")}
							onToggle={(on) => dispatch({ type: "setPmiOn", on })}
							onRateChange={(value) =>
								dispatch({ type: "edit", field: "pmiRate", value })
							}
							onBlur={() => dispatch({ type: "blur", field: "pmiRate" })}
						/>
					</Collapsible>
					<Collapsible
						title="Closing costs"
						caption="Optional. Sets your cash to close"
						invalid={hasError(CLOSING_FIELDS)}
					>
						<ClosingCostsFields
							closing={inputs.closing}
							credits={inputs.closingCredits}
							dollars={closingDollars}
							errorFor={errorFor}
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
					</Collapsible>
					<Collapsible
						title="Extra payments"
						caption="Pay the loan off sooner"
						invalid={hasError(EXTRA_FIELDS)}
					>
						<ExtraPaymentFields
							values={inputs}
							errorFor={errorFor}
							onChange={(field, value) =>
								dispatch({ type: "edit", field, value })
							}
							onBlur={(field) => dispatch({ type: "blur", field })}
						/>
					</Collapsible>
					<Collapsible
						title="Cost growth"
						caption="Optional yearly increases in tax and insurance"
						invalid={hasError(GROWTH_FIELDS)}
					>
						<CostGrowthFields
							values={inputs}
							errorFor={errorFor}
							onChange={(field, value) =>
								dispatch({ type: "edit", field, value })
							}
							onBlur={(field) => dispatch({ type: "blur", field })}
						/>
					</Collapsible>
					<Collapsible
						title="Affordability check"
						caption="Compare the payment with your income"
						invalid={hasError(AFFORDABILITY_FIELDS)}
					>
						<AffordabilityFields
							values={inputs}
							errorFor={errorFor}
							onChange={(field, value) =>
								dispatch({ type: "edit", field, value })
							}
							onBlur={(field) => dispatch({ type: "blur", field })}
						/>
					</Collapsible>
				</div>
			</form>
		</Card>
	);
};

export default MortgageInputPanel;
