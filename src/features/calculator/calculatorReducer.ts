import { DEFAULTS } from "@/config/defaults/defaults";
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

const armTerms = DEFAULTS.armTerms.value;

export const initialCalculatorState: CalculatorState = {
	inputs: {
		homePrice: "500,000",
		downPaymentPercent: "20.00",
		downPaymentAmount: "100,000.00",
		downPaymentMode: "percent",
		termYears: DEFAULT_TERM,
		interestRate: "6.50",
		state: "NJ",
		annualTaxOverride: "",
		annualInsurance: "",
		extraAnnualInsurance: "",
		monthlyHoa: "",
		monthlyOther: "",
		pmiOn: true,
		pmiRate: "",
		loanType: "fixed",
		armMargin: microsToPercentText(armTerms.marginMicros),
		armFloor: "",
		armInitialCap: microsToPercentText(armTerms.initialCapMicros),
		armPeriodicCap: microsToPercentText(armTerms.periodicCapMicros),
		armLifetimeCap: microsToPercentText(armTerms.lifetimeCapMicros),
		armIndexPreset: "flat",
		closing: {
			lender: { mode: "amount", value: "" },
			title: { mode: "amount", value: "" },
			prepaids: { mode: "amount", value: "" },
			other: { mode: "amount", value: "" },
		},
		closingCredits: "",
		grossMonthlyIncome: "",
		otherMonthlyDebt: "",
		dtiFrontEnd: "",
		dtiBackEnd: "",
		extraMonthly: "",
		lumpSum: "",
		lumpMonth: "",
		taxGrowth: "",
		insuranceGrowth: "",
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

/** Edits to these fields can change the synced down payment counterpart. */
const PRICE_LINKED_FIELDS: ReadonlySet<EditableField> = new Set([
	"homePrice",
	"downPaymentPercent",
	"downPaymentAmount",
]);

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
			const inputs = PRICE_LINKED_FIELDS.has(action.field)
				? syncDownPayment(state.inputs)
				: state.inputs;
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
		case "setPmiOn":
			return { ...state, inputs: { ...state.inputs, pmiOn: action.on } };
		case "editClosingLine":
			return {
				...state,
				inputs: {
					...state.inputs,
					closing: {
						...state.inputs.closing,
						[action.line]: {
							...state.inputs.closing[action.line],
							value: action.value,
						},
					},
				},
			};
		case "setClosingMode":
			// Dollars and percent are not interchangeable, so the old text is dropped.
			return {
				...state,
				inputs: {
					...state.inputs,
					closing: {
						...state.inputs.closing,
						[action.line]: { mode: action.mode, value: "" },
					},
				},
			};
		case "blurClosingLine":
			return {
				...state,
				touched: { ...state.touched, [`closing:${action.line}`]: true },
			};
		case "setLoanType":
			return {
				...state,
				inputs: { ...state.inputs, loanType: action.loanType },
			};
		case "setArmIndexPreset":
			return {
				...state,
				inputs: { ...state.inputs, armIndexPreset: action.preset },
			};
		case "setState":
			return { ...state, inputs: { ...state.inputs, state: action.state } };
	}
};
