import { useDeferredValue, useMemo, useReducer } from "react";
import { buildSchedule } from "@/lib/amortization";
import { deriveArm } from "../armSchedule";
import { buildAssumptions } from "../assumptions";
import {
	calculatorReducer,
	initialCalculatorState,
} from "../calculatorReducer";
import { deriveLoan } from "../loanMath";
import { deriveMonthlyCosts } from "../monthlyCosts";
import { buildMonthlyEstimate } from "../monthlyEstimate";
import { derivePmi } from "../pmi";
import { derivePropertyTax } from "../propertyTax";

/**
 * Owns the calculator input state. Typing updates `state` immediately; the
 * loan derivation reads a deferred copy so a slow recalculation never blocks
 * keystrokes (INP). `today` is injectable so tests can fix the stale check.
 */
export const useCalculatorInputs = (today?: Date) => {
	const [state, dispatch] = useReducer(
		calculatorReducer,
		initialCalculatorState,
	);
	const deferredInputs = useDeferredValue(state.inputs);
	const derived = useMemo(() => deriveLoan(deferredInputs), [deferredInputs]);
	const arm = useMemo(
		() => deriveArm(deferredInputs, derived.loan),
		[deferredInputs, derived.loan],
	);
	// An invalid ARM input shows an error and no result at all.
	const loan =
		deferredInputs.loanType === "arm" && Object.keys(arm.errors).length > 0
			? null
			: derived.loan;
	const propertyTax = useMemo(
		() => derivePropertyTax(deferredInputs),
		[deferredInputs],
	);
	const monthlyCosts = useMemo(
		() => deriveMonthlyCosts(deferredInputs),
		[deferredInputs],
	);
	const schedule = useMemo(() => {
		if (!loan) return null;
		if (deferredInputs.loanType === "arm") return arm.result?.rows ?? null;
		return buildSchedule({
			loan: loan.loanAmount,
			rate: loan.interestRate,
			payments: loan.termYears * 12,
		});
	}, [loan, deferredInputs.loanType, arm.result]);
	const pmi = useMemo(
		() => derivePmi(deferredInputs, loan, schedule),
		[deferredInputs, loan, schedule],
	);
	const estimate = useMemo(
		() =>
			buildMonthlyEstimate(
				loan,
				propertyTax.tax,
				monthlyCosts.costs,
				pmi.result,
			),
		[loan, propertyTax.tax, monthlyCosts.costs, pmi.result],
	);
	const now = useMemo(() => today ?? new Date(), [today]);
	const assumptions = useMemo(
		() =>
			buildAssumptions({
				inputs: deferredInputs,
				loan,
				tax: propertyTax.tax,
				costs: monthlyCosts.costs,
				pmi: pmi.result,
				today: now,
			}),
		[
			deferredInputs,
			loan,
			propertyTax.tax,
			monthlyCosts.costs,
			pmi.result,
			now,
		],
	);
	return {
		state,
		assumptions,
		dispatch,
		derived,
		loan,
		arm,
		propertyTax,
		monthlyCosts,
		pmi,
		estimate,
		schedule,
	};
};
