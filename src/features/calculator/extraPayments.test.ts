import { describe, expect, it } from "vitest";
import { buildSchedule, lifetimeInterest } from "@/lib/amortization";
import type { Cents } from "@/types/units";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveExtraPayments } from "./extraPayments";
import { deriveLoan } from "./loanMath";
import { derivePmi } from "./pmi";
import type { CalculatorInputs } from "./types";

const inputs = (o: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
	...initialCalculatorState.inputs,
	homePrice: "500,000",
	downPaymentPercent: "20",
	downPaymentMode: "percent",
	interestRate: "6.5",
	termYears: 30,
	...o,
});

const run = (i: CalculatorInputs) => {
	const { loan } = deriveLoan(i);
	const base = loan
		? buildSchedule({
				loan: loan.loanAmount,
				rate: loan.interestRate,
				payments: loan.termYears * 12,
			})
		: null;
	return { loan, base, derivation: deriveExtraPayments(i, loan, base) };
};

/** Principal plus extra over the schedule, and the last balance. */
const invariants = (
	rows: { principal: number; extra: number; balance: number }[],
	loan: number,
) => {
	const paid = rows.reduce((sum, r) => sum + r.principal + r.extra, 0);
	expect(paid).toBe(loan);
	expect(rows.at(-1)?.balance).toBe(0);
};

describe("deriveExtraPayments", () => {
	it("pays off in month 293 and saves $111,892.52 with $200 extra", () => {
		const { derivation } = run(inputs({ extraMonthly: "200" }));
		expect(derivation.result?.payoffMonth).toBe(293);
		expect(derivation.result?.interestSaved).toBe(11_189_252);
		expect(derivation.result?.monthsSaved).toBe(67);
		invariants(derivation.result?.rows ?? [], 40_000_000);
	});

	it("applies a lump sum to principal in its month", () => {
		const { derivation } = run(inputs({ lumpSum: "50,000", lumpMonth: "12" }));
		const rows = derivation.result?.rows ?? [];
		expect(rows[11]?.extra).toBe(5_000_000);
		expect(rows[10]?.extra).toBe(0);
		expect(derivation.result?.interestSaved).toBeGreaterThan(0);
		invariants(rows, 40_000_000);
	});

	it("pays only the remaining balance when an extra is larger", () => {
		const { derivation } = run(
			inputs({ lumpSum: "9,999,999", lumpMonth: "3" }),
		);
		const rows = derivation.result?.rows ?? [];
		expect(rows).toHaveLength(3);
		expect(rows[2]?.balance).toBe(0);
		invariants(rows, 40_000_000);
	});

	it("has no result when nothing is entered", () => {
		const { derivation } = run(inputs());
		expect(derivation).toEqual({ errors: {}, result: null });
	});

	it("validates the lump sum and its month", () => {
		expect(run(inputs({ lumpSum: "1000" })).derivation.errors.lumpMonth).toBe(
			"Enter the month of the lump sum",
		);
		expect(
			run(inputs({ lumpSum: "1000", lumpMonth: "361" })).derivation.errors
				.lumpMonth,
		).toBe("Month must be a whole number from 1 to 360");
		expect(
			run(inputs({ lumpSum: "1000", lumpMonth: "2.5" })).derivation.errors
				.lumpMonth,
		).toBeDefined();
		expect(
			run(inputs({ extraMonthly: "abc" })).derivation.errors.extraMonthly,
		).toBeDefined();
	});

	it("ignores extras for an ARM", () => {
		const { derivation } = run(
			inputs({ loanType: "arm", extraMonthly: "200" }),
		);
		expect(derivation.result).toBeNull();
	});
});

describe("PMI with extra payments", () => {
	it("moves the 80% removal month earlier but not the 78% end month", () => {
		const i = inputs({ downPaymentPercent: "10", extraMonthly: "500" });
		const { loan, base, derivation } = run(i);
		const plain = derivePmi(i, loan, base).result;
		const withExtra = derivePmi(
			i,
			loan,
			base,
			derivation.result?.rows ?? null,
		).result;
		if (plain?.status !== "on" || withExtra?.status !== "on") {
			throw new Error("PMI should be on");
		}
		expect(withExtra.pmi.removalMonth).toBeLessThan(plain.pmi.removalMonth);
		expect(withExtra.pmi.endsMonth).toBe(plain.pmi.endsMonth);
		expect(lifetimeInterest(base ?? [])).toBeGreaterThan(0 as Cents);
	});
});
