import type { Cents, Micros } from "@/types/units";
import { ledgerMonth, type ScheduleRow } from "./amortization";
import { monthlyPayment } from "./payment";
import { roundHalfUp } from "./rounding";

/** 5 years fixed, then a reset every 6 months (5/6 ARM, PRD 8.5). */
export const ARM_FIXED_MONTHS = 60;
export const ARM_ADJUSTMENT_INTERVAL = 6;
/** Rate rounding step: 0.125% is 1,250 millionths. */
export const ARM_RATE_STEP = 1_250;
/** Caps and margin are rejected above 100% (1,000,000 millionths). */
export const MAX_ARM_POINTS = 1_000_000;

/** All rates and caps are integer millionths; 2 points is 20000. */
export interface ArmParams {
	/** Months at the start rate before the first reset. */
	fixedMonths: number;
	/** Months between resets after the fixed period. */
	intervalMonths: number;
	/** Cap on the first reset, against the start rate. */
	initialCap: Micros;
	/** Cap on every later reset, against the previous rate. */
	periodicCap: Micros;
	/** Ceiling is start rate + lifetimeCap; the start rate - lifetimeCap bounds it below. */
	lifetimeCap: Micros;
	margin: Micros;
	/** Lowest rate after a reset. Defaults to the margin. */
	floor: Micros;
}

/** The registry's ARM terms (`DEFAULTS.armTerms.value`), structurally. */
export interface ArmTerms {
	marginMicros: Micros;
	initialCapMicros: Micros;
	periodicCapMicros: Micros;
	lifetimeCapMicros: Micros;
}

/** Builds engine parameters from registry terms. Floor defaults to the margin. */
export const armParamsFromTerms = (
	terms: ArmTerms,
	overrides: Partial<ArmParams> = {},
): ArmParams => ({
	fixedMonths: ARM_FIXED_MONTHS,
	intervalMonths: ARM_ADJUSTMENT_INTERVAL,
	initialCap: terms.initialCapMicros,
	periodicCap: terms.periodicCapMicros,
	lifetimeCap: terms.lifetimeCapMicros,
	margin: terms.marginMicros,
	floor: terms.marginMicros,
	...overrides,
});

/** Index value (millionths) used at a reset, given the 1-based reset month. */
export type IndexPath = (resetMonth: number) => Micros;

/** The index stays at `rate` for the whole loan. */
export const flatIndex =
	(rate: Micros): IndexPath =>
	() =>
		rate;

/**
 * `before` until `fromMonth`, then `after`. A shock is a step up and a crash
 * is a step down: stepIndex(3.75%, 9.00%, 61) is the PRD shock case.
 */
export const stepIndex =
	(before: Micros, after: Micros, fromMonth: number): IndexPath =>
	(month) =>
		month >= fromMonth ? after : before;

/**
 * Rises `perYear` for every full 12 months since `fromMonth`: `base` at
 * `fromMonth` through `fromMonth + 11`, base + perYear at fromMonth + 12, and
 * so on. Pass the first reset month (61) for "+1 point per year".
 */
export const risingIndex =
	(base: Micros, perYear: Micros, fromMonth: number): IndexPath =>
	(month) =>
		(base +
			perYear * Math.max(0, Math.floor((month - fromMonth) / 12))) as Micros;

export interface ArmRow extends ScheduleRow {
	/** Annual rate in force this month. */
	rate: Micros;
	/** Scheduled principal and interest in force this month. */
	scheduledPayment: Cents;
	/** True in a month where the rate was reset. */
	reset: boolean;
	/** True for every month after the fixed period (PRD 8.5 label). */
	hypothetical: boolean;
}

export interface ArmInput {
	loan: Cents;
	/** Start (note) rate for the fixed period. */
	startRate: Micros;
	/** Total scheduled payments, years x 12. */
	payments: number;
	params: ArmParams;
	indexPath: IndexPath;
	/** Optional extra principal per month, as in `buildSchedule`. */
	extra?: (month: number) => number;
}

const isMicros = (value: number): boolean => Number.isSafeInteger(value);

const validateParams = (params: ArmParams): void => {
	const points: [string, number][] = [
		["initialCap", params.initialCap],
		["periodicCap", params.periodicCap],
		["lifetimeCap", params.lifetimeCap],
		["margin", params.margin],
		["floor", params.floor],
	];
	for (const [name, value] of points) {
		if (!isMicros(value) || value < 0) {
			throw new RangeError(
				`${name} must be a non-negative integer in millionths`,
			);
		}
		if (value > MAX_ARM_POINTS) {
			throw new RangeError(`${name} cannot be more than 100%`);
		}
	}
	if (!Number.isInteger(params.fixedMonths) || params.fixedMonths < 0) {
		throw new RangeError("fixedMonths must be a non-negative integer");
	}
	if (!Number.isInteger(params.intervalMonths) || params.intervalMonths < 1) {
		throw new RangeError("intervalMonths must be a positive integer");
	}
};

/**
 * New rate at a reset (PRD 8.5):
 *   target  = round(index + margin) to the nearest 0.125%, half up
 *   lowest  = max(prev - cap, floor, start - lifetimeCap)
 *   highest = min(prev + cap, start + lifetimeCap)
 *   newRate = min(max(target, lowest), highest)
 * `cap` is the initial cap at the first reset and the periodic cap after.
 * If the floor is above the highest allowed rate the caps win. A negative
 * index is fine: the floor keeps the result at or above zero.
 */
export const resetRate = (
	index: Micros,
	prev: Micros,
	start: Micros,
	cap: Micros,
	params: ArmParams,
): Micros => {
	if (!isMicros(index))
		throw new RangeError("index must be an integer in millionths");
	const target =
		roundHalfUp(Math.max(0, index + params.margin), ARM_RATE_STEP) *
		ARM_RATE_STEP;
	const lowest = Math.max(prev - cap, params.floor, start - params.lifetimeCap);
	const highest = Math.min(prev + cap, start + params.lifetimeCap);
	return Math.min(Math.max(target, lowest), highest) as Micros;
};

/**
 * Month-by-month 5/6 ARM ledger (PRD 8.5), integer cents. The monthly rules
 * are the fixed-rate ledger's (`ledgerMonth`). At each reset month the payment
 * is recalculated from the current balance and the remaining months, so the
 * term is never restarted:
 *   newPI = PI(balance, newRate, payments - month + 1)
 * Resets fall in months fixedMonths + 1, + intervalMonths, and so on. The
 * schedule ends early if extra payments clear the balance.
 */
export const buildArmSchedule = ({
	loan,
	startRate,
	payments,
	params,
	indexPath,
	extra,
}: ArmInput): ArmRow[] => {
	validateParams(params);
	if (!isMicros(startRate) || startRate < 0) {
		throw new RangeError(
			"startRate must be a non-negative integer in millionths",
		);
	}

	const rows: ArmRow[] = [];
	let balance = loan;
	let rate = startRate;
	let pi = monthlyPayment(loan, startRate, payments);
	let resets = 0;

	for (let month = 1; month <= payments && balance > 0; month++) {
		const isReset =
			month > params.fixedMonths &&
			(month - params.fixedMonths - 1) % params.intervalMonths === 0;
		if (isReset) {
			const cap = resets === 0 ? params.initialCap : params.periodicCap;
			rate = resetRate(indexPath(month), rate, startRate, cap, params);
			pi = monthlyPayment(balance, rate, payments - month + 1);
			resets++;
		}
		const step = ledgerMonth(
			balance,
			rate,
			pi,
			month === payments,
			extra?.(month) ?? 0,
		);
		balance = step.balance;
		rows.push({
			month,
			payment: (step.regular + step.extraPaid) as Cents,
			interest: step.interest,
			principal: step.principal,
			extra: step.extraPaid,
			balance,
			rate,
			scheduledPayment: pi,
			reset: isReset,
			hypothetical: month > params.fixedMonths,
		});
	}
	return rows;
};
