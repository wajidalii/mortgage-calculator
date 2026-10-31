import { parseMoney } from "@/lib/money";
import { monthlyPayment } from "@/lib/payment";
import { parseRate } from "@/lib/rate";
import { roundHalfUp } from "@/lib/rounding";
import type { Cents, Micros } from "@/types/units";
import type { CalculatorInputs, DerivedLoan, InputErrors } from "./types";
import {
	DOWN_PAYMENT_TOO_HIGH,
	MAX_INTEREST_RATE,
	parseMessage,
	RATE_TOO_HIGH,
} from "./validation";

const MICROS_PER_WHOLE = 1_000_000;

/** $10,000,000. Keeps every intermediate product inside the safe integer range. */
export const MAX_HOME_PRICE = 1_000_000_000 as Cents;

export { DOWN_PAYMENT_TOO_HIGH };

/** Down payment in cents from a fraction in millionths: round(price x pct). */
export const downPaymentFromPercent = (price: Cents, percent: Micros): Cents =>
	roundHalfUp(price * percent, MICROS_PER_WHOLE) as Cents;

/** Down payment fraction in millionths from cents: round(down / price). */
export const percentFromDownPayment = (price: Cents, down: Cents): Micros =>
	roundHalfUp(down * MICROS_PER_WHOLE, price) as Micros;

/** Loan amount L = H - down, which equals H x (1 - d). */
export const loanAmountFor = (price: Cents, down: Cents): Cents =>
	(price - down) as Cents;

/** LTV = L / H in millionths. */
export const ltvFor = (price: Cents, loan: Cents): Micros =>
	roundHalfUp(loan * MICROS_PER_WHOLE, price) as Micros;

/** Plain text for a synced field: "100,000.00" (no currency sign). */
export const centsToFieldText = (cents: Cents): string => {
	const dollars = Math.floor(cents / 100);
	const rest = String(cents - dollars * 100).padStart(2, "0");
	return `${String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${rest}`;
};

/** Plain percent text for a synced field: 200000 -> "20.00". */
export const microsToPercentText = (micros: Micros): string => {
	const hundredths = roundHalfUp(micros, 100);
	const text = String(hundredths).padStart(3, "0");
	return `${text.slice(0, -2)}.${text.slice(-2)}`;
};

/**
 * Validates the raw inputs and derives loan amount and LTV. Pure: the same
 * inputs always give the same result, and no field is read from the DOM.
 */
export const deriveLoan = (inputs: CalculatorInputs): DerivedLoan => {
	const errors: InputErrors = {};

	const price = parseMoney(inputs.homePrice);
	let homePrice: Cents | null = null;
	if (!price.ok) {
		errors.homePrice = parseMessage("a home price", price.error);
	} else if (price.value <= 0) {
		errors.homePrice = "Home price must be more than $0";
	} else if (price.value > MAX_HOME_PRICE) {
		errors.homePrice = "Home price cannot be more than $10,000,000";
	} else {
		homePrice = price.value;
	}

	const rate = parseRate(inputs.interestRate);
	if (!rate.ok) {
		errors.interestRate = parseMessage("an interest rate", rate.error);
	} else if (rate.value > MAX_INTEREST_RATE) {
		errors.interestRate = RATE_TOO_HIGH;
	}

	let downPayment: Cents | null = null;
	if (inputs.downPaymentMode === "percent") {
		const percent = parseRate(inputs.downPaymentPercent);
		if (!percent.ok) {
			errors.downPayment = parseMessage("a down payment", percent.error);
		} else if (percent.value > MICROS_PER_WHOLE) {
			errors.downPayment = "Down payment cannot be more than 100%";
		} else if (homePrice !== null) {
			downPayment = downPaymentFromPercent(homePrice, percent.value);
		}
	} else {
		const amount = parseMoney(inputs.downPaymentAmount);
		if (!amount.ok) {
			errors.downPayment = parseMessage("a down payment", amount.error);
		} else if (homePrice !== null && amount.value > homePrice) {
			errors.downPayment = DOWN_PAYMENT_TOO_HIGH;
		} else if (amount.value > MAX_HOME_PRICE) {
			errors.downPayment = DOWN_PAYMENT_TOO_HIGH;
		} else {
			downPayment = amount.value;
		}
	}

	if (
		homePrice === null ||
		downPayment === null ||
		!rate.ok ||
		Object.keys(errors).length > 0
	) {
		return { errors, loan: null };
	}

	const loanAmount = loanAmountFor(homePrice, downPayment);
	return {
		errors,
		loan: {
			homePrice,
			downPayment,
			downPaymentPercent: percentFromDownPayment(homePrice, downPayment),
			loanAmount,
			monthlyPrincipalAndInterest: monthlyPayment(
				loanAmount,
				rate.value,
				inputs.termYears * 12,
			),
			ltv: ltvFor(homePrice, loanAmount),
			interestRate: rate.value,
			termYears: inputs.termYears,
		},
	};
};
