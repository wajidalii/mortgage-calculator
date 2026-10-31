import { deriveArm } from "@/features/calculator/armSchedule";
import { initialCalculatorState } from "@/features/calculator/calculatorReducer";
import { deriveLoan } from "@/features/calculator/loanMath";
import type {
	CalculatorInputs,
	ErrorField,
	IndexPresetId,
	LoanDerivation,
	LoanTerm,
	LoanType,
} from "@/features/calculator/types";
import { buildSchedule, lifetimeInterest } from "@/lib/amortization";
import type { Cents, Micros } from "@/types/units";

/**
 * Comparison state. Plain strings and literals only, so a saved scenario (S-18)
 * can serialize it as JSON and read it back unchanged.
 */
export interface CompareShared {
	homePrice: string;
	/** Percent text, for example "20". */
	downPaymentPercent: string;
}

export interface ScenarioInput {
	loanType: LoanType;
	termYears: LoanTerm;
	interestRate: string;
	armIndexPreset: IndexPresetId;
}

export interface CompareState {
	shared: CompareShared;
	scenarios: [ScenarioInput, ScenarioInput];
}

export const initialCompareState: CompareState = {
	shared: { homePrice: "500,000", downPaymentPercent: "20" },
	scenarios: [
		{
			loanType: "fixed",
			termYears: 15,
			interestRate: "6.50",
			armIndexPreset: "flat",
		},
		{
			loanType: "fixed",
			termYears: 30,
			interestRate: "6.50",
			armIndexPreset: "flat",
		},
	],
};

/** The calculator inputs for one column: shared fields plus its own. */
export const toCalculatorInputs = (
	shared: CompareShared,
	scenario: ScenarioInput,
): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	homePrice: shared.homePrice,
	downPaymentPercent: shared.downPaymentPercent,
	downPaymentMode: "percent",
	termYears: scenario.termYears,
	interestRate: scenario.interestRate,
	loanType: scenario.loanType,
	armIndexPreset: scenario.armIndexPreset,
});

export interface ScenarioSummary {
	loan: LoanDerivation;
	isArm: boolean;
	/** Fixed payment, or the ARM payment for months 1 to 60. */
	payment: Cents;
	/** Highest scheduled ARM payment under the index path. Null for fixed. */
	peakPayment: Cents | null;
	lifetimeInterest: Cents;
}

export interface ScenarioResult {
	/** Errors that belong to this column (its rate). */
	errors: Partial<Record<ErrorField, string>>;
	summary: ScenarioSummary | null;
}

export interface Comparison {
	/** Errors in the shared price and down payment. */
	sharedErrors: Partial<Record<ErrorField, string>>;
	scenarios: [ScenarioResult, ScenarioResult];
}

const deriveScenario = (
	shared: CompareShared,
	scenario: ScenarioInput,
): { shared: Comparison["sharedErrors"]; result: ScenarioResult } => {
	const inputs = toCalculatorInputs(shared, scenario);
	const derived = deriveLoan(inputs);
	const { homePrice, downPayment, ...own } = derived.errors;
	const sharedErrors: Comparison["sharedErrors"] = {};
	if (homePrice) sharedErrors.homePrice = homePrice;
	if (downPayment) sharedErrors.downPayment = downPayment;
	const loan = derived.loan;
	if (!loan)
		return { shared: sharedErrors, result: { errors: own, summary: null } };

	if (scenario.loanType === "arm") {
		const arm = deriveArm(inputs, loan);
		if (!arm.result) {
			return { shared: sharedErrors, result: { errors: own, summary: null } };
		}
		return {
			shared: sharedErrors,
			result: {
				errors: own,
				summary: {
					loan,
					isArm: true,
					payment: arm.result.summary.firstPayment,
					peakPayment: arm.result.summary.peakPayment,
					lifetimeInterest: lifetimeInterest(arm.result.rows),
				},
			},
		};
	}
	const rows = buildSchedule({
		loan: loan.loanAmount,
		rate: loan.interestRate as Micros,
		payments: loan.termYears * 12,
	});
	return {
		shared: sharedErrors,
		result: {
			errors: own,
			summary: {
				loan,
				isArm: false,
				payment: loan.monthlyPrincipalAndInterest,
				peakPayment: null,
				lifetimeInterest: lifetimeInterest(rows),
			},
		},
	};
};

/** Both columns from one state, so a shared input always moves both. */
export const deriveComparison = (state: CompareState): Comparison => {
	const a = deriveScenario(state.shared, state.scenarios[0]);
	const b = deriveScenario(state.shared, state.scenarios[1]);
	return {
		sharedErrors: { ...b.shared, ...a.shared },
		scenarios: [a.result, b.result],
	};
};
