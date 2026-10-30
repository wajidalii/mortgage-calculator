import { describe, expect, it } from "vitest";
import type { Cents, Micros } from "@/types/units";
import { buildSchedule, lifetimeInterest } from "./amortization";
import { monthlyPayment } from "./payment";

/**
 * Randomized comparison against a decimal reference (PRD 12.2).
 *
 * The reference is written independently of src/lib: exact BigInt rationals,
 * no shared helpers, and a different rounding expression (divmod, not
 * floor((2n + d) / 2d)). The seed is fixed, so any failure reproduces.
 */

const SEED = 20261030;
const CASES = 3000;
const DEN = 12_000_000n; // 12 months x 1,000,000 micros

/** mulberry32: small deterministic PRNG. */
const makeRandom = (seed: number) => {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

interface LoanCase {
	cents: number;
	micros: number;
	years: number;
}

const makeCases = (): LoanCase[] => {
	const random = makeRandom(SEED);
	const pick = <T>(items: readonly T[]): T =>
		items[Math.floor(random() * items.length)] as T;
	// 2% to 12% in 0.125% steps = 20,000 to 120,000 micros in steps of 1,250.
	const rates = Array.from({ length: 81 }, (_, i) => 20_000 + i * 1_250);
	return Array.from({ length: CASES }, () => ({
		// $50,000.00 to $2,000,000.00, to the cent.
		cents: 5_000_000 + Math.floor(random() * (200_000_000 - 5_000_000 + 1)),
		micros: pick(rates),
		years: pick([15, 20, 30] as const),
	}));
};

/** Round-half-up of a/b for non-negative BigInts, via divmod. */
const divRound = (a: bigint, b: bigint): bigint => {
	const quotient = a / b;
	const remainder = a % b;
	return remainder * 2n >= b ? quotient + 1n : quotient;
};

/** Exact PI as a fraction num/den, before any rounding. */
const exactPayment = (loan: bigint, micros: bigint, n: bigint) => {
	const growth = (DEN + micros) ** n;
	return {
		num: loan * micros * growth,
		den: DEN * (growth - DEN ** n),
	};
};

interface ReferenceRow {
	interest: bigint;
	principal: bigint;
	balance: bigint;
}

const referenceLedger = (loan: bigint, micros: bigint, n: number) => {
	const exact = exactPayment(loan, micros, BigInt(n));
	const pi = divRound(exact.num, exact.den);
	const rows: ReferenceRow[] = [];
	let balance = loan;
	for (let month = 1; month <= n; month++) {
		const interest = divRound(balance * micros, DEN);
		const due = balance + interest;
		const payment = month === n || pi > due ? due : pi;
		const principal = payment - interest;
		balance -= principal;
		rows.push({ interest, principal, balance });
	}
	// Closed form uses the unrounded payment: n x PI - L.
	const closedForm = divRound(exact.num * BigInt(n), exact.den) - loan;
	return { pi, rows, closedForm };
};

const cases = makeCases();

describe("fixed-rate engine vs decimal reference (PRD 12.2)", () => {
	it("generates at least 3,000 distinct, in-range cases", () => {
		expect(cases.length).toBeGreaterThanOrEqual(3000);
		expect(new Set(cases.map((c) => JSON.stringify(c))).size).toBe(
			cases.length,
		);
		for (const c of cases) {
			expect(c.cents).toBeGreaterThanOrEqual(5_000_000);
			expect(c.cents).toBeLessThanOrEqual(200_000_000);
			expect((c.micros - 20_000) % 1_250).toBe(0);
			expect([15, 20, 30]).toContain(c.years);
		}
	});

	it("matches the reference payment and every ledger interest line exactly", () => {
		const mismatches: string[] = [];
		for (const c of cases) {
			const n = c.years * 12;
			const reference = referenceLedger(BigInt(c.cents), BigInt(c.micros), n);
			const rows = buildSchedule({
				loan: c.cents as Cents,
				rate: c.micros as Micros,
				payments: n,
			});
			if (
				BigInt(monthlyPayment(c.cents as Cents, c.micros as Micros, n)) !==
				reference.pi
			) {
				mismatches.push(`payment ${JSON.stringify(c)}`);
			}
			if (rows.length !== n) mismatches.push(`length ${JSON.stringify(c)}`);
			for (let i = 0; i < n; i++) {
				const row = rows[i];
				const ref = reference.rows[i];
				if (
					!row ||
					!ref ||
					BigInt(row.interest) !== ref.interest ||
					BigInt(row.principal) !== ref.principal ||
					BigInt(row.balance) !== ref.balance
				) {
					mismatches.push(`row ${i + 1} ${JSON.stringify(c)}`);
					break;
				}
			}
			if (rows.at(-1)?.balance !== 0)
				mismatches.push(`balance ${JSON.stringify(c)}`);
		}
		expect(mismatches).toEqual([]);
	});

	/**
	 * Each cent of rounding (in the payment or in a month's interest) is
	 * carried forward at the monthly rate and paid back in the final payment.
	 * Its worst-case size is therefore about S = ((1 + r)^n - 1) / r cents,
	 * which is small for short or cheap loans and large for 30 years at high
	 * rates.
	 */
	const growthBound = (c: LoanCase): number => {
		const r = c.micros / 12_000_000;
		return ((1 + r) ** (c.years * 12) - 1) / r;
	};

	const interestGaps = cases.map((c) => {
		const n = c.years * 12;
		const reference = referenceLedger(BigInt(c.cents), BigInt(c.micros), n);
		const rows = buildSchedule({
			loan: c.cents as Cents,
			rate: c.micros as Micros,
			payments: n,
		});
		const gap = BigInt(lifetimeInterest(rows)) - reference.closedForm;
		return { c, gap: Number(gap < 0n ? -gap : gap) };
	});

	it("keeps ledger interest within $5 of closed form wherever $5 is achievable", () => {
		// PRD 12.2 tolerance. Applies when the rounding growth bound is <= $5.
		const applicable = interestGaps.filter(({ c }) => growthBound(c) <= 500);
		expect(applicable.length).toBeGreaterThan(1000);
		expect(applicable.filter(({ gap }) => gap > 500)).toEqual([]);
	});

	it("never exceeds the rounding growth bound for any case", () => {
		expect(interestGaps.filter(({ c, gap }) => gap > growthBound(c))).toEqual(
			[],
		);
	});

	it("documents that 30 year loans at high rates can pass $5 (PRD 12.2 note)", () => {
		const over = interestGaps.filter(({ gap }) => gap > 500);
		expect(over.every(({ c }) => c.years === 30 && growthBound(c) > 500)).toBe(
			true,
		);
		expect(Math.max(...interestGaps.map(({ gap }) => gap))).toBeLessThan(2000);
	});

	it("detects the float rate multiplication the PRD warns about", () => {
		// Sensitivity check: if this fails, the suite could not catch the bug.
		let floatMismatches = 0;
		for (const c of cases) {
			const n = c.years * 12;
			const reference = referenceLedger(BigInt(c.cents), BigInt(c.micros), n);
			let balance = c.cents;
			let floatInterest = 0;
			const pi = Number(reference.pi);
			for (let month = 1; month <= n; month++) {
				const interest = Math.round(balance * (c.micros / 1_000_000 / 12));
				floatInterest += interest;
				const payment =
					month === n || pi > balance + interest ? balance + interest : pi;
				balance -= payment - interest;
			}
			const exact = reference.rows.reduce((sum, row) => sum + row.interest, 0n);
			if (BigInt(floatInterest) !== exact) floatMismatches++;
		}
		expect(floatMismatches).toBeGreaterThan(0);
	});
});
