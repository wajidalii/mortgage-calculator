import { parseMoney } from "@/lib/money";
import { parseRate } from "@/lib/rate";
import type { Cents, Micros } from "@/types/units";
import { downPaymentFromPercent, MAX_HOME_PRICE } from "./loanMath";
import {
	type CalculatorInputs,
	CLOSING_LINES,
	type ClosingLineId,
	type ErrorField,
	type LoanDerivation,
} from "./types";
import { parseMessage } from "./validation";

const MAX_PERCENT = 1_000_000 as Micros;

/**
 * cashToClose = downPayment + sum(closingCostLines) - credits (PRD 8.10).
 * All values are integer cents.
 */
export const cashToCloseFor = (
	downPayment: Cents,
	lines: readonly Cents[],
	credits: Cents,
): Cents =>
	(downPayment +
		lines.reduce((sum, amount) => sum + amount, 0) -
		credits) as Cents;

export interface ClosingLineResult {
	id: ClosingLineId;
	label: string;
	amount: Cents;
}

/** The cash needed on closing day, itemized. */
export interface ClosingCosts {
	downPayment: Cents;
	/** Every line, including those left blank ($0). */
	lines: ClosingLineResult[];
	/** Sum of the lines. */
	total: Cents;
	credits: Cents;
	cashToClose: Cents;
}

export interface ClosingDerivation {
	errors: Partial<Record<ErrorField, string>>;
	/** Present only when the loan and every closing input are valid. */
	costs: ClosingCosts | null;
	/**
	 * Dollar value of each valid line. A percent line shows this next to its
	 * field, so it is filled in even while another field is invalid.
	 */
	dollars: Partial<Record<ClosingLineId, Cents>>;
}

type Parsed = { value: Cents | null } | { error: string };

/** One optional line. Blank is $0. A percent line needs a valid price. */
const parseLine = (
	input: CalculatorInputs["closing"][ClosingLineId],
	price: Cents | null,
): Parsed => {
	const text = input.value.trim();
	if (text === "") return { value: 0 as Cents };
	if (input.mode === "amount") {
		const parsed = parseMoney(text);
		if (!parsed.ok) {
			return { error: parseMessage("closing cost", parsed.error) };
		}
		if (parsed.value > MAX_HOME_PRICE) {
			return { error: "Closing cost is too large" };
		}
		return { value: parsed.value };
	}
	const parsed = parseRate(text);
	if (!parsed.ok) {
		return { error: parseMessage("closing cost percent", parsed.error) };
	}
	if (parsed.value > MAX_PERCENT) {
		return { error: "Closing cost cannot be more than 100% of the price" };
	}
	return {
		value: price === null ? null : downPaymentFromPercent(price, parsed.value),
	};
};

/**
 * Closing cost lines, credits and cash to close. A percent line is a share of
 * the home price. Credits cannot exceed the down payment plus closing costs,
 * so cash to close is never negative.
 */
export const deriveClosingCosts = (
	inputs: CalculatorInputs,
	loan: LoanDerivation | null,
): ClosingDerivation => {
	const errors: Partial<Record<ErrorField, string>> = {};
	const dollars: Partial<Record<ClosingLineId, Cents>> = {};

	const priceParsed = parseMoney(inputs.homePrice);
	const price =
		priceParsed.ok &&
		priceParsed.value > 0 &&
		priceParsed.value <= MAX_HOME_PRICE
			? priceParsed.value
			: null;

	const lines: ClosingLineResult[] = [];
	let complete = true;
	for (const { id, label } of CLOSING_LINES) {
		const parsed = parseLine(inputs.closing[id], price);
		if ("error" in parsed) {
			errors[`closing:${id}`] = parsed.error;
			complete = false;
		} else if (parsed.value === null) {
			complete = false;
		} else {
			dollars[id] = parsed.value;
			lines.push({ id, label, amount: parsed.value });
		}
	}

	let credits: Cents | null = 0 as Cents;
	const creditsText = inputs.closingCredits.trim();
	if (creditsText !== "") {
		const parsed = parseMoney(creditsText);
		if (!parsed.ok) {
			errors.closingCredits = parseMessage("credits", parsed.error);
			credits = null;
		} else if (parsed.value > MAX_HOME_PRICE) {
			errors.closingCredits = "Credits are too large";
			credits = null;
		} else {
			credits = parsed.value;
		}
	}

	if (!complete || credits === null || !loan) {
		return { errors, costs: null, dollars };
	}
	const total = lines.reduce((sum, line) => sum + line.amount, 0) as Cents;
	if (credits > loan.downPayment + total) {
		errors.closingCredits =
			"Credits cannot be more than the down payment plus closing costs";
		return { errors, costs: null, dollars };
	}
	return {
		errors,
		costs: {
			downPayment: loan.downPayment,
			lines,
			total,
			credits,
			cashToClose: cashToCloseFor(
				loan.downPayment,
				lines.map((line) => line.amount),
				credits,
			),
		},
		dollars,
	};
};
