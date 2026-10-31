import { DEFAULTS } from "@/config/defaults/defaults";
import { initialCalculatorState } from "@/features/calculator/calculatorReducer";
import { type CalculatorInputs, LOAN_TERMS } from "@/features/calculator/types";
import {
	type CompareState,
	initialCompareState,
} from "@/features/compare/compare";

/** True when `value` has the same keys and primitive types as `template`. */
const sameShape = (template: unknown, value: unknown): boolean => {
	if (typeof template !== typeof value) return false;
	if (typeof template !== "object" || template === null) return true;
	if (typeof value !== "object" || value === null) return false;
	if (Array.isArray(template)) {
		return Array.isArray(value) && value.length === template.length
			? template.every((item, i) => sameShape(item, value[i]))
			: false;
	}
	const a = Object.keys(template).sort();
	const b = Object.keys(value).sort();
	return (
		a.length === b.length &&
		a.every((key, i) => key === b[i]) &&
		a.every((key) =>
			sameShape(
				(template as Record<string, unknown>)[key],
				(value as Record<string, unknown>)[key],
			),
		)
	);
};

const presetIds = DEFAULTS.indexPathPresets.value.map((item) => item.id);
const oneOf = (allowed: readonly unknown[], value: unknown): boolean =>
	allowed.includes(value);

/** Returns the saved calculator inputs, or null if they are not usable. */
export const parseCalculatorInputs = (
	data: unknown,
): CalculatorInputs | null => {
	if (!sameShape(initialCalculatorState.inputs, data)) return null;
	const inputs = data as CalculatorInputs;
	const ok =
		oneOf(["percent", "amount"], inputs.downPaymentMode) &&
		oneOf(LOAN_TERMS, inputs.termYears) &&
		oneOf(Object.keys(DEFAULTS.stateTaxRates.value), inputs.state) &&
		oneOf(["fixed", "arm"], inputs.loanType) &&
		oneOf(presetIds, inputs.armIndexPreset) &&
		Object.values(inputs.closing).every((line) =>
			oneOf(["amount", "percent"], line.mode),
		);
	return ok ? inputs : null;
};

/** Returns the saved comparison, or null if it is not usable. */
export const parseCompareState = (data: unknown): CompareState | null => {
	if (!sameShape(initialCompareState, data)) return null;
	const state = data as CompareState;
	const ok = state.scenarios.every(
		(scenario) =>
			oneOf(["fixed", "arm"], scenario.loanType) &&
			oneOf(LOAN_TERMS, scenario.termYears) &&
			oneOf(presetIds, scenario.armIndexPreset),
	);
	return ok ? state : null;
};
