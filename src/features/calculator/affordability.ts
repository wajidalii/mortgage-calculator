import { DEFAULTS } from "@/config/defaults/defaults";
import { parseMoney } from "@/lib/money";
import { parseRate } from "@/lib/rate";
import { roundHalfUp } from "@/lib/rounding";
import type { Cents, Micros } from "@/types/units";
import { MAX_HOME_PRICE } from "./loanMath";
import type { MonthlyEstimate } from "./monthlyEstimate";
import type { CalculatorInputs, ErrorField } from "./types";
import { parseMessage } from "./validation";

/** Shown with every affordability result (AR-1). */
export const NOT_A_LOAN_APPROVAL =
	"This is not a loan approval. Lenders look at credit, assets, loan program rules and more.";

/** A threshold above 100% of income is not a ratio anyone can use. */
const MAX_THRESHOLD = 1_000_000 as Micros;

/**
 * A ratio in millionths, rounded half up to one decimal place of a percent.
 * 3,000 / 10,000 gives 300000 (30.0%). Income must be above zero.
 */
export const ratioMicros = (amount: Cents, income: Cents): Micros =>
	(roundHalfUp(amount * 1000, income) * 1000) as Micros;

export interface DtiRatio {
	/** Rounded to one decimal, the same value that is shown. */
	ratio: Micros;
	threshold: Micros;
	thresholdIsDefault: boolean;
	/** The rounded ratio is above the threshold. */
	above: boolean;
}

/** Simplified debt-to-income ratios (PRD 8.11). */
export interface Affordability {
	income: Cents;
	/** Lender payment plus HOA. */
	housing: Cents;
	otherDebt: Cents;
	frontEnd: DtiRatio;
	backEnd: DtiRatio;
}

export interface AffordabilityDerivation {
	errors: Partial<Record<ErrorField, string>>;
	/** Null until the estimate and every affordability input are valid. */
	result: Affordability | null;
}

const parseThreshold = (
	text: string,
	fallback: Micros,
	label: string,
): { value: Micros; isDefault: boolean } | { error: string } => {
	if (text.trim() === "") return { value: fallback, isDefault: true };
	const parsed = parseRate(text);
	if (!parsed.ok) return { error: parseMessage(label, parsed.error) };
	if (parsed.value === 0) return { error: `${label} must be more than 0%` };
	if (parsed.value > MAX_THRESHOLD) {
		return { error: `${label} cannot be more than 100%` };
	}
	return { value: parsed.value, isDefault: false };
};

const dtiRatio = (
	amount: Cents,
	income: Cents,
	threshold: { value: Micros; isDefault: boolean },
): DtiRatio => {
	const ratio = ratioMicros(amount, income);
	return {
		ratio,
		threshold: threshold.value,
		thresholdIsDefault: threshold.isDefault,
		above: ratio > threshold.value,
	};
};

export const deriveAffordability = (
	inputs: CalculatorInputs,
	estimate: MonthlyEstimate | null,
): AffordabilityDerivation => {
	const errors: Partial<Record<ErrorField, string>> = {};

	const income = parseMoney(inputs.grossMonthlyIncome);
	if (!income.ok) {
		errors.grossMonthlyIncome = parseMessage(
			"your gross monthly income",
			income.error,
		);
	} else if (income.value === 0) {
		errors.grossMonthlyIncome = "Income must be more than $0";
	} else if (income.value > MAX_HOME_PRICE) {
		errors.grossMonthlyIncome = "Income is too large";
	}

	// Blank other debt is $0.
	const debt =
		inputs.otherMonthlyDebt.trim() === ""
			? ({ ok: true, value: 0 as Cents } as const)
			: parseMoney(inputs.otherMonthlyDebt);
	if (!debt.ok) {
		errors.otherMonthlyDebt = parseMessage("other monthly debt", debt.error);
	} else if (debt.value > MAX_HOME_PRICE) {
		errors.otherMonthlyDebt = "Other monthly debt is too large";
	}

	const front = parseThreshold(
		inputs.dtiFrontEnd,
		DEFAULTS.dtiThresholds.value.frontEndMicros,
		"Front-end limit",
	);
	if ("error" in front) errors.dtiFrontEnd = front.error;
	const back = parseThreshold(
		inputs.dtiBackEnd,
		DEFAULTS.dtiThresholds.value.backEndMicros,
		"Back-end limit",
	);
	if ("error" in back) errors.dtiBackEnd = back.error;

	if (
		!estimate ||
		!income.ok ||
		!debt.ok ||
		"error" in front ||
		"error" in back ||
		Object.keys(errors).length > 0
	) {
		return { errors, result: null };
	}

	const hoa = estimate.nonEscrow.find((line) => line.id === "hoa");
	const housing = (estimate.lenderPayment + (hoa?.amount ?? 0)) as Cents;
	return {
		errors,
		result: {
			income: income.value,
			housing,
			otherDebt: debt.value,
			frontEnd: dtiRatio(housing, income.value, front),
			backEnd: dtiRatio((housing + debt.value) as Cents, income.value, back),
		},
	};
};
