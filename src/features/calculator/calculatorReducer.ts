import { parseMoney } from "@/lib/money";
import { parseRate } from "@/lib/rate";
import {
	centsToFieldText,
	downPaymentFromPercent,
	MAX_HOME_PRICE,
	microsToPercentText,
	percentFromDownPayment,
} from "./loanMath";
import type {
	CalculatorAction,
	CalculatorInputs,
	CalculatorState,
	EditableField,
	ErrorField,
	LoanTerm,
} from "./types";

export const DEFAULT_TERM: LoanTerm = 30;

export const initialCalculatorState: CalculatorState = {
	inputs: {
		homePrice: "500,000",
		downPaymentPercent: "20.00",
		downPaymentAmount: "100,000.00",
		downPaymentMode: "percent",
		termYears: DEFAULT_TERM,
		interestRate: "6.50",
	},
	touched: {},
};

/**
 * Rewrites the non-source down payment field from the source field so both
 * forms agree. Leaves the other field alone when the source is not valid yet.
 */
export const syncDownPayment = (inputs: CalculatorInputs): CalculatorInputs => {
	const price = parseMoney(inputs.homePrice);
	if (!price.ok || price.value <= 0 || price.value > MAX_HOME_PRICE) {
		return inputs;
	}
	if (inputs.downPaymentMode === "percent") {
		const percent = parseRate(inputs.downPaymentPercent);
		if (!percent.ok || percent.value > 1_000_000) return inputs;
		const cents = downPaymentFromPercent(price.value, percent.value);
		return { ...inputs, downPaymentAmount: centsToFieldText(cents) };
	}
	const amount = parseMoney(inputs.downPaymentAmount);
	if (!amount.ok || amount.value > price.value) return inputs;
	const percent = percentFromDownPayment(price.value, amount.value);
	return { ...inputs, downPaymentPercent: microsToPercentText(percent) };
};

const errorFieldFor = (field: EditableField): ErrorField =>
	field === "downPaymentPercent" || field === "downPaymentAmount"
		? "downPayment"
		: field;

export const calculatorReducer = (
	state: CalculatorState,
	action: CalculatorAction,
): CalculatorState => {
	switch (action.type) {
		case "edit":
			return {
				...state,
				inputs: { ...state.inputs, [action.field]: action.value },
			};
		case "blur": {
			const touched = { ...state.touched, [errorFieldFor(action.field)]: true };
			// Price and down payment edits both change the synced counterpart.
			const inputs =
				action.field === "interestRate"
					? state.inputs
					: syncDownPayment(state.inputs);
			return { inputs, touched };
		}
		case "setDownPaymentMode":
			// Both forms were already synced on blur, so only the source changes.
			return {
				...state,
				inputs: { ...state.inputs, downPaymentMode: action.mode },
			};
		case "setTerm":
			return { ...state, inputs: { ...state.inputs, termYears: action.years } };
	}
};
