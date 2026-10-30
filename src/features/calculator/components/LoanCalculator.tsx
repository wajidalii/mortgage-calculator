import Card from "@/components/ui/Card";
import { useCalculatorInputs } from "../hooks/useCalculatorInputs";
import DownPaymentFields from "./DownPaymentFields";
import LoanSummary from "./LoanSummary";
import TermSelector from "./TermSelector";
import TextField from "./TextField";

const LoanCalculator = () => {
	const { state, dispatch, derived } = useCalculatorInputs();
	const { inputs, touched } = state;
	// Show a message only after the user has left the field.
	const shown = (field: keyof typeof touched) =>
		touched[field] ? derived.errors[field] : undefined;

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
				</form>
			</Card>
			<LoanSummary loan={derived.loan} />
		</div>
	);
};

export default LoanCalculator;
