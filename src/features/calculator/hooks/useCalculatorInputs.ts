import { useDeferredValue, useMemo, useReducer } from "react";
import { buildSchedule } from "@/lib/amortization";
import {
	calculatorReducer,
	initialCalculatorState,
} from "../calculatorReducer";
import { deriveLoan } from "../loanMath";
import { deriveMonthlyCosts } from "../monthlyCosts";
import { derivePmi } from "../pmi";
import { derivePropertyTax } from "../propertyTax";

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
	const propertyTax = useMemo(
		() => derivePropertyTax(deferredInputs),
		[deferredInputs],
	);
	const monthlyCosts = useMemo(
		() => deriveMonthlyCosts(deferredInputs),
		[deferredInputs],
	);
	const schedule = useMemo(() => {
		const loan = derived.loan;
		return loan
			? buildSchedule({
					loan: loan.loanAmount,
					rate: loan.interestRate,
					payments: loan.termYears * 12,
				})
			: null;
	}, [derived.loan]);
	const pmi = useMemo(
		() => derivePmi(deferredInputs, derived.loan, schedule),
		[deferredInputs, derived.loan, schedule],
	);
	return { state, dispatch, derived, propertyTax, monthlyCosts, pmi, schedule };
};
