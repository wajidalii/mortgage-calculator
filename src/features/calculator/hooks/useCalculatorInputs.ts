import {
	useDeferredValue,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from "react";
import { buildSchedule, type ScheduleRow } from "@/lib/amortization";
import { type ArmResult, deriveArm } from "../armSchedule";
import { type AssumptionItem, buildAssumptions } from "../assumptions";
import {
	calculatorReducer,
	initialCalculatorState,
} from "../calculatorReducer";
import { deriveLoan } from "../loanMath";
import { deriveMonthlyCosts, type MonthlyCosts } from "../monthlyCosts";
import { buildMonthlyEstimate, type MonthlyEstimate } from "../monthlyEstimate";
import { derivePmi, type PmiResult } from "../pmi";
import { derivePropertyTax, type PropertyTax } from "../propertyTax";
import type { LoanDerivation } from "../types";
import { keepsLastResult } from "../validation";

/** Everything the result views show. */
export interface ResultSet {
	loan: LoanDerivation | null;
	arm: ArmResult | null;
	tax: PropertyTax | null;
	costs: MonthlyCosts | null;
	pmi: PmiResult | null;
	estimate: MonthlyEstimate | null;
	schedule: ScheduleRow[] | null;
	assumptions: AssumptionItem[];
}

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
	const current = useMemo<ResultSet>(
		() => ({
			loan,
			arm: arm.result,
			tax: propertyTax.tax,
			costs: monthlyCosts.costs,
			pmi: pmi.result,
			estimate,
			schedule,
			assumptions,
		}),
		[
			loan,
			arm.result,
			propertyTax.tax,
			monthlyCosts.costs,
			pmi.result,
			estimate,
			schedule,
			assumptions,
		],
	);

	// Non-numeric text in a money field keeps the last valid result on screen;
	// every other error clears it (PRD S-10).
	const errors = {
		...derived.errors,
		...propertyTax.errors,
		...monthlyCosts.errors,
		...arm.errors,
		...pmi.errors,
	};
	const isComplete =
		estimate !== null &&
		Object.values(errors).every((message) => message === undefined);
	const lastValid = useRef<ResultSet | null>(null);
	useEffect(() => {
		if (isComplete) lastValid.current = current;
	}, [isComplete, current]);
	const held = keepsLastResult(errors, deferredInputs)
		? lastValid.current
		: null;

	return {
		state,
		dispatch,
		derived,
		arm,
		propertyTax,
		monthlyCosts,
		pmi,
		results: held ?? current,
		showingLastResult: held !== null,
	};
};
