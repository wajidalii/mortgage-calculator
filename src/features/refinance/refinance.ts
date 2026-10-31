import {
	MAX_INTEREST_RATE,
	parseMessage,
} from "@/features/calculator/validation";
import { parseMoney } from "@/lib/money";
import { monthlyPayment } from "@/lib/payment";
import { parseRate } from "@/lib/rate";
import type { Cents, Micros } from "@/types/units";

export const MAX_REMAINING_MONTHS = 480;
const MAX_MONEY = 1_000_000_000 as Cents;

/** Raw text the user typed. */
export interface RefinanceInputs {
	balance: string;
	remainingMonths: string;
	currentRate: string;
	newRate: string;
	costs: string;
}

export type RefinanceField = keyof RefinanceInputs;

export const initialRefinanceInputs: RefinanceInputs = {
	balance: "",
	remainingMonths: "",
	currentRate: "",
	newRate: "",
	costs: "",
};

export interface Refinance {
	currentPayment: Cents;
	newPayment: Cents;
	/** currentPI - newPI. Zero or negative when the new payment is not lower. */
	monthlySaving: Cents;
	costs: Cents;
	/** Null when the new payment is not lower. */
	breakEvenMonths: number | null;
	/** The new term equals the remaining term (PRD 8.12). */
	termMonths: number;
}

export interface RefinanceDerivation {
	errors: Partial<Record<RefinanceField, string>>;
	/** Null until every input is valid. */
	result: Refinance | null;
}

/** ceil(costs / saving) in integers. Saving must be above zero. */
export const breakEvenMonths = (costs: Cents, saving: Cents): number =>
	Math.floor((costs + saving - 1) / saving);

const rate = (
	text: string,
	label: string,
	errors: RefinanceDerivation["errors"],
	field: RefinanceField,
): Micros | null => {
	const parsed = parseRate(text);
	if (!parsed.ok) {
		errors[field] = parseMessage(label, parsed.error);
		return null;
	}
	if (parsed.value > MAX_INTEREST_RATE) {
		errors[field] = "Interest rate cannot be more than 30%";
		return null;
	}
	return parsed.value;
};

/** Simple refinance break-even (PRD 8.12). No taxes, cash-out or discounting. */
export const deriveRefinance = (
	inputs: RefinanceInputs,
): RefinanceDerivation => {
	const errors: RefinanceDerivation["errors"] = {};

	const balance = parseMoney(inputs.balance);
	let balanceValue: Cents | null = null;
	if (!balance.ok) {
		errors.balance = parseMessage("the current balance", balance.error);
	} else if (balance.value === 0) {
		errors.balance = "Balance must be more than $0";
	} else if (balance.value > MAX_MONEY) {
		errors.balance = "Balance is too large";
	} else {
		balanceValue = balance.value;
	}

	const monthsText = inputs.remainingMonths.trim();
	let months: number | null = null;
	if (monthsText === "") {
		errors.remainingMonths = "Enter the remaining months";
	} else if (
		!/^\d{1,6}$/.test(monthsText) ||
		Number(monthsText) < 1 ||
		Number(monthsText) > MAX_REMAINING_MONTHS
	) {
		errors.remainingMonths = `Months must be a whole number from 1 to ${MAX_REMAINING_MONTHS}`;
	} else {
		months = Number(monthsText);
	}

	const current = rate(
		inputs.currentRate,
		"the current rate",
		errors,
		"currentRate",
	);
	const next = rate(inputs.newRate, "the new rate", errors, "newRate");

	let costs: Cents = 0 as Cents;
	if (inputs.costs.trim() !== "") {
		const parsed = parseMoney(inputs.costs);
		if (!parsed.ok) {
			errors.costs = parseMessage("refinance costs", parsed.error);
		} else if (parsed.value > MAX_MONEY) {
			errors.costs = "Refinance costs are too large";
		} else {
			costs = parsed.value;
		}
	}

	if (
		Object.keys(errors).length > 0 ||
		balanceValue === null ||
		months === null ||
		current === null ||
		next === null
	) {
		return { errors, result: null };
	}

	const currentPayment = monthlyPayment(balanceValue, current, months);
	const newPayment = monthlyPayment(balanceValue, next, months);
	const monthlySaving = (currentPayment - newPayment) as Cents;
	return {
		errors,
		result: {
			currentPayment,
			newPayment,
			monthlySaving,
			costs,
			breakEvenMonths:
				monthlySaving > 0 ? breakEvenMonths(costs, monthlySaving) : null,
			termMonths: months,
		},
	};
};
