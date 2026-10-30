import { describe, expect, it } from "vitest";
import { buildSchedule } from "@/lib/amortization";
import type { Cents, Micros } from "@/types/units";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveLoan } from "./loanMath";
import {
	derivePmi,
	firstMonthAtOrBelow,
	isPmiRequired,
	monthlyPmi,
} from "./pmi";
import type { CalculatorInputs } from "./types";

const inputs = (o: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	homePrice: "500,000",
	downPaymentPercent: "10",
	downPaymentMode: "percent",
	interestRate: "6.5",
	termYears: 30,
	...o,
});

const run = (i: CalculatorInputs) => {
	const { loan } = deriveLoan(i);
	const schedule = loan
		? buildSchedule({
				loan: loan.loanAmount,
				rate: loan.interestRate,
				payments: loan.termYears * 12,
			})
		: null;
	return { loan, derivation: derivePmi(i, loan, schedule) };
};

describe("isPmiRequired (boundary at 80%)", () => {
	const price = 50_000_000 as Cents;
	it("is off at exactly 80.00%", () => {
		expect(isPmiRequired(40_000_000 as Cents, price)).toBe(false);
	});
	it("is on at 80.01%", () => {
		expect(isPmiRequired(40_005_000 as Cents, price)).toBe(true);
	});
	it("is on by one cent above 80%", () => {
		expect(isPmiRequired(40_000_001 as Cents, price)).toBe(true);
	});
	it("is off below 80% and on at 90%", () => {
		expect(isPmiRequired(39_999_999 as Cents, price)).toBe(false);
		expect(isPmiRequired(45_000_000 as Cents, price)).toBe(true);
	});
});

describe("monthlyPmi", () => {
	it("gives $187.50 for a $450,000 loan at 0.50%", () => {
		expect(monthlyPmi(45_000_000 as Cents, 5_000 as Micros)).toBe(18_750);
	});
	it("gives $281.25 at the 0.75% default", () => {
		expect(monthlyPmi(45_000_000 as Cents, 7_500 as Micros)).toBe(28_125);
	});
	it("rounds half up", () => {
		// 1 cent x 6% / 12 = 0.005 cent -> 0; 100 cents x 6% / 12 = 0.5 -> 1
		expect(monthlyPmi(100 as Cents, 60_000 as Micros)).toBe(1);
		expect(monthlyPmi(99 as Cents, 60_000 as Micros)).toBe(0);
	});
});

describe("derivePmi golden case ($500,000, 10% down, 6.50%, 30 years)", () => {
	it("has LTV 90.00% and PMI on", () => {
		const { loan, derivation } = run(inputs());
		expect(loan?.ltv).toBe(900_000);
		expect(derivation.required).toBe(true);
		expect(derivation.result?.status).toBe("on");
	});

	it("ends PMI in month 109 and allows removal in month 95", () => {
		const { derivation } = run(inputs());
		if (derivation.result?.status !== "on") throw new Error("PMI should be on");
		expect(derivation.result.pmi.endsMonth).toBe(109);
		expect(derivation.result.pmi.removalMonth).toBe(95);
	});

	it("is the first month at or below 78% ($390,000) and 80% ($400,000)", () => {
		const { loan } = run(inputs());
		const schedule = buildSchedule({
			loan: loan?.loanAmount as Cents,
			rate: loan?.interestRate as Micros,
			payments: 360,
		});
		const price = 50_000_000 as Cents;
		for (const [month, limit] of [
			[109, 39_000_000],
			[95, 40_000_000],
		] as const) {
			expect(schedule[month - 1]?.balance).toBeLessThanOrEqual(limit);
			expect(schedule[month - 2]?.balance).toBeGreaterThan(limit);
		}
		expect(firstMonthAtOrBelow(schedule, price, 78)).toBe(109);
		expect(firstMonthAtOrBelow(schedule, price, 80)).toBe(95);
	});

	it("uses the 0.75% default and labels it, then an explicit 0.50% rate", () => {
		const def = run(inputs()).derivation.result;
		if (def?.status !== "on") throw new Error("PMI should be on");
		expect(def.pmi).toMatchObject({
			monthly: 28_125,
			rate: 7_500,
			rateIsDefault: true,
		});
		const explicit = run(inputs({ pmiRate: "0.50" })).derivation.result;
		if (explicit?.status !== "on") throw new Error("PMI should be on");
		expect(explicit.pmi).toMatchObject({
			monthly: 18_750,
			rate: 5_000,
			rateIsDefault: false,
		});
	});
});

describe("derivePmi states", () => {
	it("is off at exactly 80% LTV (20% down)", () => {
		const { derivation } = run(inputs({ downPaymentPercent: "20" }));
		expect(derivation).toMatchObject({
			required: false,
			result: { status: "not-required" },
		});
	});

	it("is on at 80.01% LTV", () => {
		// $500,000 with 19.99% down is a 80.01% LTV.
		const { loan, derivation } = run(inputs({ downPaymentPercent: "19.99" }));
		expect(loan?.ltv).toBe(800_100);
		expect(derivation.result?.status).toBe("on");
	});

	it("is off when the user turns it off, even above 80%", () => {
		const { derivation } = run(inputs({ pmiOn: false }));
		expect(derivation).toMatchObject({
			required: true,
			result: { status: "turned-off" },
		});
	});

	it("ignores an invalid PMI rate while PMI is off", () => {
		const { derivation } = run(inputs({ pmiOn: false, pmiRate: "abc" }));
		expect(derivation.errors).toEqual({});
	});

	it("rejects bad PMI rates and uses none", () => {
		for (const bad of ["abc", "-1", "101"]) {
			const { derivation } = run(inputs({ pmiRate: bad }));
			expect(derivation.result).toBeNull();
			expect(derivation.errors.pmiRate).toBeTruthy();
		}
	});

	it("has no result while the loan is invalid", () => {
		const { derivation } = run(inputs({ homePrice: "" }));
		expect(derivation).toEqual({ required: false, result: null, errors: {} });
	});

	it("ends PMI earlier on a shorter term", () => {
		const long = run(inputs()).derivation.result;
		const short = run(inputs({ termYears: 15 })).derivation.result;
		if (long?.status !== "on" || short?.status !== "on")
			throw new Error("PMI should be on");
		expect(short.pmi.endsMonth).toBeLessThan(long.pmi.endsMonth);
		expect(short.pmi.removalMonth).toBeLessThanOrEqual(short.pmi.endsMonth);
	});
});
