import { describe, expect, it } from "vitest";
import type { Cents } from "@/types/units";
import { initialCalculatorState } from "./calculatorReducer";
import { cashToCloseFor, deriveClosingCosts } from "./closingCosts";
import { deriveLoan } from "./loanMath";
import type {
	CalculatorInputs,
	ClosingLineId,
	ClosingLineInput,
} from "./types";

const inputs = (
	lines: Partial<Record<ClosingLineId, Partial<ClosingLineInput>>> = {},
	overrides: Partial<CalculatorInputs> = {},
): CalculatorInputs => {
	const base = initialCalculatorState.inputs;
	const closing = { ...base.closing };
	for (const [id, patch] of Object.entries(lines)) {
		const key = id as ClosingLineId;
		closing[key] = { ...closing[key], ...patch };
	}
	return { ...base, ...overrides, closing };
};

const derive = (
	lines: Parameters<typeof inputs>[0] = {},
	overrides: Partial<CalculatorInputs> = {},
) => {
	const i = inputs(lines, overrides);
	return deriveClosingCosts(i, deriveLoan(i).loan);
};

describe("cashToCloseFor", () => {
	it("adds the down payment and every line", () => {
		expect(
			cashToCloseFor(10_000_000 as Cents, [1_200_000 as Cents], 0 as Cents),
		).toBe(11_200_000);
	});

	it("subtracts credits", () => {
		expect(
			cashToCloseFor(
				10_000_000 as Cents,
				[800_000, 400_000] as Cents[],
				250_000 as Cents,
			),
		).toBe(10_950_000);
	});

	it("is the down payment with no lines and no credits", () => {
		expect(cashToCloseFor(5_000_000 as Cents, [], 0 as Cents)).toBe(5_000_000);
	});
});

describe("deriveClosingCosts", () => {
	it("gives $112,000.00 for $100,000 down and $12,000 closing costs", () => {
		const { costs, errors } = derive({ other: { value: "12,000" } });
		expect(errors).toEqual({});
		expect(costs?.cashToClose).toBe(11_200_000);
		expect(costs?.total).toBe(1_200_000);
	});

	it("treats blank lines as $0", () => {
		const { costs } = derive();
		expect(costs?.total).toBe(0);
		expect(costs?.cashToClose).toBe(10_000_000);
		expect(costs?.lines).toHaveLength(4);
	});

	it("adds the lines up to the total", () => {
		const { costs } = derive({
			lender: { value: "3,000.50" },
			title: { value: "1,999.25" },
			prepaids: { value: "6,000" },
			other: { value: "0.25" },
		});
		const sum = costs?.lines.reduce((s, line) => s + line.amount, 0);
		expect(sum).toBe(1_100_000);
		expect(costs?.total).toBe(sum);
		expect(costs?.cashToClose).toBe(10_000_000 + (sum ?? 0));
	});

	it("takes a percent of the home price and shows the dollar value", () => {
		const { costs, dollars } = derive({
			other: { mode: "percent", value: "2.5" },
		});
		// 2.5% of $500,000
		expect(dollars.other).toBe(1_250_000);
		expect(costs?.total).toBe(1_250_000);
		expect(costs?.cashToClose).toBe(11_250_000);
	});

	it("rounds a percent line to the cent, half up", () => {
		// 0.0003% of $500,000.00 = $1.50
		expect(
			derive({ other: { mode: "percent", value: "0.0003" } }).dollars.other,
		).toBe(150);
		// 0.0005% of $1,000.00 = half a cent, which rounds up to 1 cent
		const half = derive(
			{ other: { mode: "percent", value: "0.0005" } },
			{ homePrice: "1000" },
		);
		expect(half.dollars.other).toBe(1);
	});

	it("subtracts credits", () => {
		const { costs } = derive(
			{ other: { value: "12,000" } },
			{ closingCredits: "2,500" },
		);
		expect(costs?.credits).toBe(250_000);
		expect(costs?.cashToClose).toBe(10_950_000);
	});

	it("rejects credits above the down payment plus closing costs", () => {
		const { costs, errors } = derive({}, { closingCredits: "100,000.01" });
		expect(costs).toBeNull();
		expect(errors.closingCredits).toBe(
			"Credits cannot be more than the down payment plus closing costs",
		);
		expect(derive({}, { closingCredits: "100,000" }).costs?.cashToClose).toBe(
			0,
		);
	});

	it("reports invalid lines and credits and returns no total", () => {
		const { costs, errors } = derive(
			{
				lender: { value: "abc" },
				title: { value: "-5" },
				other: { mode: "percent", value: "101" },
			},
			{ closingCredits: "x" },
		);
		expect(costs).toBeNull();
		expect(errors).toEqual({
			"closing:lender": "Closing cost must be a number",
			"closing:title": "Closing cost cannot be negative",
			"closing:other": "Closing cost cannot be more than 100% of the price",
			closingCredits: "Credits must be a number",
		});
	});

	it("still shows other valid dollar values while one line is invalid", () => {
		const { dollars } = derive({
			lender: { value: "abc" },
			other: { mode: "percent", value: "1" },
		});
		expect(dollars).toEqual({ title: 0, prepaids: 0, other: 500_000 });
	});

	it("has no total and no percent dollars when the price is invalid", () => {
		const { costs, dollars } = derive(
			{ other: { mode: "percent", value: "1" } },
			{ homePrice: "" },
		);
		expect(costs).toBeNull();
		expect(dollars.other).toBeUndefined();
	});
});
