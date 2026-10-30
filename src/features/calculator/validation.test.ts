import { describe, expect, it } from "vitest";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveLoan } from "./loanMath";
import type { CalculatorInputs } from "./types";
import {
	keepsLastResult,
	MAX_INTEREST_RATE,
	nonNumericMoneyFields,
	parseMessage,
	RATE_TOO_HIGH,
} from "./validation";

const inputs = (
	overrides: Partial<CalculatorInputs> = {},
): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	...overrides,
});

describe("parseMessage", () => {
	it("words each parse error", () => {
		expect(parseMessage("a home price", "empty")).toBe("Enter a home price");
		expect(parseMessage("a home price", "invalid")).toBe(
			"A home price must be a number",
		);
		expect(parseMessage("a home price", "negative")).toBe(
			"A home price cannot be negative",
		);
		expect(parseMessage("a home price", "too-large")).toBe(
			"A home price is too large",
		);
	});
});

describe("interest rate range (0% to 30%)", () => {
	const rateError = (interestRate: string) =>
		deriveLoan(inputs({ interestRate })).errors.interestRate;

	it("accepts 0% and 30%", () => {
		expect(MAX_INTEREST_RATE).toBe(300_000);
		expect(rateError("0")).toBeUndefined();
		expect(rateError("30")).toBeUndefined();
	});

	it("rejects 31% with no result", () => {
		expect(rateError("31")).toBe(RATE_TOO_HIGH);
		expect(deriveLoan(inputs({ interestRate: "31" })).loan).toBeNull();
	});

	it("rejects a rate just above 30%", () => {
		expect(rateError("30.0001")).toBe(RATE_TOO_HIGH);
	});

	it("rejects -1% with no result", () => {
		expect(rateError("-1")).toBe("An interest rate cannot be negative");
		expect(deriveLoan(inputs({ interestRate: "-1" })).loan).toBeNull();
	});

	it("rejects text and blank", () => {
		expect(rateError("abc")).toBe("An interest rate must be a number");
		expect(rateError("")).toBe("Enter an interest rate");
	});
});

describe("down payment above the price", () => {
	it("uses the exact message in both entry modes", () => {
		const percent = deriveLoan(inputs({ downPaymentPercent: "101" }));
		expect(percent.errors.downPayment).toBe(
			"Down payment cannot be more than 100%",
		);
		const amount = deriveLoan(
			inputs({ downPaymentMode: "amount", downPaymentAmount: "500,000.01" }),
		);
		expect(amount.errors.downPayment).toBe(
			"Down payment cannot be more than the price",
		);
		expect(amount.loan).toBeNull();
	});
});

describe("nonNumericMoneyFields", () => {
	it("finds letters in money fields only", () => {
		const bad = nonNumericMoneyFields(
			inputs({ homePrice: "abc", monthlyHoa: "12x", monthlyOther: "" }),
		);
		expect([...bad].sort()).toEqual(["homePrice", "monthlyHoa"]);
	});

	it("ignores blank, negative and valid text", () => {
		expect(
			nonNumericMoneyFields(
				inputs({ homePrice: "", monthlyHoa: "-5", monthlyOther: "1,200" }),
			).size,
		).toBe(0);
	});

	it("reads the dollar down payment only in dollar mode", () => {
		const text = { downPaymentAmount: "abc" };
		expect(nonNumericMoneyFields(inputs(text)).size).toBe(0);
		expect([
			...nonNumericMoneyFields(inputs({ ...text, downPaymentMode: "amount" })),
		]).toEqual(["downPayment"]);
	});
});

describe("keepsLastResult", () => {
	it("is true when every error is non-numeric money text", () => {
		expect(
			keepsLastResult({ homePrice: "x" }, inputs({ homePrice: "abc" })),
		).toBe(true);
	});

	it("is false with no errors", () => {
		expect(keepsLastResult({}, inputs())).toBe(false);
		expect(keepsLastResult({ homePrice: undefined }, inputs())).toBe(false);
	});

	it("is false when any other error is present", () => {
		expect(
			keepsLastResult(
				{ homePrice: "x", interestRate: RATE_TOO_HIGH },
				inputs({ homePrice: "abc", interestRate: "31" }),
			),
		).toBe(false);
	});

	it("is false for a blank required field", () => {
		expect(keepsLastResult({ homePrice: "x" }, inputs({ homePrice: "" }))).toBe(
			false,
		);
	});
});
