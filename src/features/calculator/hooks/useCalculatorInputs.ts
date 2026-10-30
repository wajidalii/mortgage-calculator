import { useDeferredValue, useMemo, useReducer } from "react";
import {
	calculatorReducer,
	initialCalculatorState,
} from "../calculatorReducer";
import { deriveLoan } from "../loanMath";

/**
 * Owns the calculator input state. Typing updates `state` immediately; the
 * loan derivation reads a deferred copy so a slow recalculation never blocks
 * keystrokes (INP).
 */
export const useCalculatorInputs = () => {
	const [state, dispatch] = useReducer(
		calculatorReducer,
		initialCalculatorState,
	);
	const deferredInputs = useDeferredValue(state.inputs);
	const derived = useMemo(() => deriveLoan(deferredInputs), [deferredInputs]);
	return { state, dispatch, derived };
};
