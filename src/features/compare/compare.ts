import { deriveArm } from "@/features/calculator/armSchedule";
import { initialCalculatorState } from "@/features/calculator/calculatorReducer";
import { deriveClosingCosts } from "@/features/calculator/closingCosts";
import { deriveLoan } from "@/features/calculator/loanMath";
import { deriveMonthlyCosts } from "@/features/calculator/monthlyCosts";
import {
	buildMonthlyEstimate,
	type MonthlyEstimate,
} from "@/features/calculator/monthlyEstimate";
import { derivePmi } from "@/features/calculator/pmi";
import { derivePropertyTax } from "@/features/calculator/propertyTax";
import type {
	CalculatorInputs,
	ErrorField,
	IndexPresetId,
	LoanDerivation,
	LoanTerm,
	LoanType,
} from "@/features/calculator/types";
import {
	buildSchedule,
	lifetimeInterest,
	type ScheduleRow,
} from "@/lib/amortization";
import type { Cents, Micros } from "@/types/units";

/**
 * Comparison state. Plain strings and literals only, so a saved scenario (S-18)
 * can serialize it as JSON and read it back unchanged. Each loan owns every
 * input, so editing one never moves the other.
 */
export interface ScenarioInput {
	homePrice: string;
	/** Percent text, for example "20". */
	downPaymentPercent: string;
	loanType: LoanType;
	termYears: LoanTerm;
	interestRate: string;
	armIndexPreset: IndexPresetId;
}

export type ScenarioPair = [ScenarioInput, ScenarioInput];

export interface CompareState {
	scenarios: ScenarioPair;
}

export const initialCompareState: CompareState = {
	scenarios: [
		{
			homePrice: "500,000",
			downPaymentPercent: "20",
			loanType: "fixed",
			termYears: 15,
			interestRate: "6.50",
			armIndexPreset: "flat",
		},
		{
			homePrice: "500,000",
			downPaymentPercent: "20",
			loanType: "fixed",
			termYears: 30,
			interestRate: "6.50",
			armIndexPreset: "flat",
		},
	],
};

/** Loan A and Loan B trade places. */
export const swapScenarios = (state: CompareState): CompareState => ({
	scenarios: [state.scenarios[1], state.scenarios[0]],
});

/** Loan B becomes a copy of Loan A, as a starting point for one change. */
export const duplicateFirstScenario = (state: CompareState): CompareState => ({
	scenarios: [state.scenarios[0], { ...state.scenarios[0] }],
});

/**
 * Reads a comparison saved before each loan owned its price and down payment
 * (storage version 1: `{ shared, scenarios }`). Anything else is returned as is.
 */
export const upgradeLegacyCompare = (data: unknown): unknown => {
	if (typeof data !== "object" || data === null || !("shared" in data)) {
		return data;
	}
	const { shared, scenarios } = data as {
		shared?: { homePrice?: unknown; downPaymentPercent?: unknown };
		scenarios?: unknown;
	};
	if (!Array.isArray(scenarios) || typeof shared !== "object" || !shared) {
		return data;
	}
	return {
		scenarios: scenarios.map((scenario) => ({
			homePrice: shared.homePrice,
			downPaymentPercent: shared.downPaymentPercent,
			...scenario,
		})),
	};
};

/** The calculator inputs for one loan; everything else keeps its default. */
export const toCalculatorInputs = (
	scenario: ScenarioInput,
): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	homePrice: scenario.homePrice,
	downPaymentPercent: scenario.downPaymentPercent,
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
	/** Itemized monthly cost from the calculator engine (PMI included when on). */
	estimate: MonthlyEstimate | null;
	/** Down payment only: this page does not estimate closing costs. */
	cashToClose: Cents | null;
}

export interface ScenarioResult {
	/** This loan's own input errors. */
	errors: Partial<Record<ErrorField, string>>;
	summary: ScenarioSummary | null;
}

export interface Comparison {
	scenarios: [ScenarioResult, ScenarioResult];
}

const deriveScenario = (scenario: ScenarioInput): ScenarioResult => {
	const inputs = toCalculatorInputs(scenario);
	const derived = deriveLoan(inputs);
	const errors = derived.errors;
	const loan = derived.loan;
	if (!loan) return { errors, summary: null };

	let rows: ScheduleRow[];
	let peakPayment: Cents | null = null;
	let payment: Cents = loan.monthlyPrincipalAndInterest;
	if (scenario.loanType === "arm") {
		const arm = deriveArm(inputs, loan);
		if (!arm.result) return { errors, summary: null };
		rows = arm.result.rows;
		payment = arm.result.summary.firstPayment;
		peakPayment = arm.result.summary.peakPayment;
	} else {
		rows = buildSchedule({
			loan: loan.loanAmount,
			rate: loan.interestRate as Micros,
			payments: loan.termYears * 12,
		});
	}

	const pmi = derivePmi(inputs, loan, rows).result;
	const estimate = buildMonthlyEstimate(
		loan,
		derivePropertyTax(inputs).tax,
		deriveMonthlyCosts(inputs).costs,
		pmi,
	);
	return {
		errors,
		summary: {
			loan,
			isArm: scenario.loanType === "arm",
			payment,
			peakPayment,
			lifetimeInterest: lifetimeInterest(rows),
			estimate,
			cashToClose: deriveClosingCosts(inputs, loan).costs?.cashToClose ?? null,
		},
	};
};

/** Both loans from one state. Each is derived from its own inputs only. */
export const deriveComparison = (state: CompareState): Comparison => ({
	scenarios: [
		deriveScenario(state.scenarios[0]),
		deriveScenario(state.scenarios[1]),
	],
});

export type MetricId =
	| "total"
	| "payment"
	| "lifetimeInterest"
	| "cashToClose"
	| "loanAmount";

export interface Metric {
	id: MetricId;
	label: string;
	/** Cents per loan, or null when that loan has no valid result. */
	values: [Cents | null, Cents | null];
	/** Index of the lower value, or null for a tie or a missing value. */
	lower: 0 | 1 | null;
	/** Absolute difference in cents, when both values exist. */
	difference: Cents | null;
}

const lowerOf = (a: Cents | null, b: Cents | null): 0 | 1 | null => {
	if (a === null || b === null || a === b) return null;
	return a < b ? 0 : 1;
};

/** The comparable numbers, in display order. Never ranks the loans. */
export const buildMetrics = (comparison: Comparison): Metric[] => {
	const [a, b] = comparison.scenarios.map((result) => result.summary) as [
		ScenarioSummary | null,
		ScenarioSummary | null,
	];
	const metric = (
		id: MetricId,
		label: string,
		pick: (summary: ScenarioSummary) => Cents | null,
	): Metric => {
		const values: Metric["values"] = [a ? pick(a) : null, b ? pick(b) : null];
		const [x, y] = values;
		return {
			id,
			label,
			values,
			lower: lowerOf(x, y),
			difference: x !== null && y !== null ? (Math.abs(x - y) as Cents) : null,
		};
	};
	return [
		metric("total", "Total monthly cost", (s) => s.estimate?.total ?? null),
		metric("payment", "Principal and interest", (s) => s.payment),
		metric("lifetimeInterest", "Lifetime interest", (s) => s.lifetimeInterest),
		metric("cashToClose", "Cash to close", (s) => s.cashToClose),
		metric("loanAmount", "Loan amount", (s) => s.loan.loanAmount),
	];
};

export interface CompareNote {
	id: string;
	text: string;
	/** "differs" flags an input that is not the same in both loans. */
	tone: "differs" | "assumption";
}

/**
 * What a reader must keep in mind: inputs that are not equivalent, and the
 * assumptions both loans share. Purely descriptive; it never picks a winner.
 */
export const buildCompareNotes = (
	state: CompareState,
	comparison: Comparison,
): CompareNote[] => {
	const [a, b] = state.scenarios;
	const notes: CompareNote[] = [];
	const differs = (id: string, text: string) =>
		notes.push({ id, text, tone: "differs" });
	if (a.homePrice.trim() !== b.homePrice.trim()) {
		differs(
			"price",
			"Home prices differ, so property tax and insurance differ too.",
		);
	}
	if (a.downPaymentPercent.trim() !== b.downPaymentPercent.trim()) {
		differs(
			"down",
			"Down payments differ, so loan amount, cash to close and PMI can differ.",
		);
	}
	if (a.termYears !== b.termYears) {
		differs(
			"term",
			`Terms differ (${a.termYears} and ${b.termYears} years). A shorter term usually means a higher payment and less interest over the loan.`,
		);
	}
	const arm = comparison.scenarios.some((result) => result.summary?.isArm);
	if (arm) {
		differs(
			"arm",
			a.loanType === b.loanType
				? "Both loans are ARMs. Rates after month 60 are hypothetical, based on an assumed index path."
				: "A fixed rate and an ARM are not equivalent. The ARM payment holds for months 1 to 60 only, and later rates are hypothetical.",
		);
	}
	notes.push({
		id: "shared",
		tone: "assumption",
		text: "Both loans use the same illustrative tax, insurance and PMI assumptions as the calculator, and no closing costs. Open the calculator to change them.",
	});
	return notes;
};
