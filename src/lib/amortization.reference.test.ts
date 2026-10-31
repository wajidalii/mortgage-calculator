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
 *
 * Ledger interest is compared to the closed form with a derived bound, not a
 * flat tolerance. See "Rounding bound" below and PRD 12.2.
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
	return { pi, rows, exact };
};

/**
 * Rounding bound (PRD 12.2). Let r = micros / DEN be the monthly rate, n the
 * number of payments, P* the exact (unrounded) payment and P = P* + d0 the
 * cent-rounded one. Month t rounds interest by e_t, so the ledger interest is
 * B x r + e_t. Every rounding error is within half a cent (|d0|, |e_t| <= 1/2).
 *
 * Let x_t be the ledger balance minus the exact balance. Then
 *   x_t = (1 + r) x_(t-1) + e_t - d0,   x_0 = 0.
 * The last payment clears the balance, so it is P* + (1 + r) x_(n-1) + e_n.
 * Total ledger interest = (n - 1) P + last payment - L, closed form = n P* - L:
 *   gap = d0 ((n - 1) - G) + sum_(t=1..n) e_t (1 + r)^(n-t),
 *   G = ((1 + r)^n - (1 + r)) / r  >= n - 1.
 * With S = ((1 + r)^n - 1) / r this gives, in cents,
 *   |gap| <= (G - (n - 1)) / 2 + S / 2 = S - n / 2.
 *
 * Precondition: no payment before the last clears the loan early. Write S_k for
 * the same sum with k terms. Then ledger balance > 0 at every month needs
 * P* / (1 + r) > S_(n-1) (exact balance after month k exceeds S_k, the largest
 * possible x_k, for every k < n, and the exact balance falls as S_k rises, so
 * k = n - 1 is the worst case). The terms below are the exact rationals.
 */
interface Rational {
	num: bigint;
	den: bigint;
}

/** S - n / 2 in cents, as an exact rational. */
const roundingBound = (micros: bigint, n: number): Rational => {
	const k = micros * DEN ** BigInt(n - 1);
	const growth = (DEN + micros) ** BigInt(n);
	return { num: 2n * (growth - DEN ** BigInt(n)) - BigInt(n) * k, den: 2n * k };
};

/** True when the bound is at most `cents`. */
const boundAtMost = (bound: Rational, cents: bigint): boolean =>
	bound.num <= cents * bound.den;

/** P* / (1 + r) > S_(n-1): no payment before the last can clear the loan. */
const noEarlyPayoff = (loan: bigint, micros: bigint, n: number): boolean => {
	const exact = exactPayment(loan, micros, BigInt(n));
	const sSum = (DEN + micros) ** BigInt(n - 1) - DEN ** BigInt(n - 1);
	const sDen = micros * DEN ** BigInt(n - 2);
	// (num / den) x DEN / (DEN + micros) > sSum / sDen
	return exact.num * DEN * sDen > sSum * exact.den * (DEN + micros);
};

interface Measured {
	loan: bigint;
	micros: bigint;
	n: number;
	/** |ledger interest - exact closed-form interest| x exact.den, in cents. */
	scaledGap: bigint;
	den: bigint;
	bound: Rational;
	mismatches: string[];
}

/** Runs the engine and the reference for one loan and compares them. */
const measure = (c: LoanCase): Measured => {
	const n = c.years * 12;
	const loan = BigInt(c.cents);
	const micros = BigInt(c.micros);
	const reference = referenceLedger(loan, micros, n);
	const rows = buildSchedule({
		loan: c.cents as Cents,
		rate: c.micros as Micros,
		payments: n,
	});
	const mismatches: string[] = [];
	const label = JSON.stringify(c);
	if (
		BigInt(monthlyPayment(c.cents as Cents, c.micros as Micros, n)) !==
		reference.pi
	) {
		mismatches.push(`payment ${label}`);
	}
	if (rows.length !== n) mismatches.push(`length ${label}`);
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
			mismatches.push(`row ${i + 1} ${label}`);
			break;
		}
	}
	if (rows.at(-1)?.balance !== 0) mismatches.push(`balance ${label}`);

	// Closed-form interest is n x P* - L, with P* = num / den, so
	// (ledger - closed) x den = (ledger + L) x den - n x num.
	const { num, den } = reference.exact;
	const scaled =
		(BigInt(lifetimeInterest(rows)) + loan) * den - BigInt(n) * num;
	return {
		loan,
		micros,
		n,
		scaledGap: scaled < 0n ? -scaled : scaled,
		den,
		bound: roundingBound(micros, n),
		mismatches,
	};
};

/** |gap| <= bound, exactly. */
const withinBound = (m: Measured): boolean =>
	m.scaledGap * m.bound.den <= m.bound.num * m.den;

/** |gap| <= cents, exactly. */
const withinCents = (m: Measured, cents: bigint): boolean =>
	m.scaledGap <= cents * m.den;

const cases = makeCases();
const measured = cases.map(measure);

/** Every rate on the PRD grid (2% to 12%, 0.125% steps) for each term. */
const domainCorners: LoanCase[] = [15, 20, 30].flatMap((years) =>
	Array.from({ length: 81 }, (_, i) => 20_000 + i * 1_250).flatMap((micros) =>
		// Smallest and largest PRD balances, and an odd one in between.
		[5_000_000, 123_456_789, 200_000_000].map((cents) => ({
			cents,
			micros,
			years,
		})),
	),
);

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

	it("matches the reference payment and every ledger line exactly", () => {
		expect(measured.flatMap((m) => m.mismatches)).toEqual([]);
	});

	it("matches the reference at every grid rate and term, at both balance limits", () => {
		expect(domainCorners).toHaveLength(729);
		expect(domainCorners.flatMap((c) => measure(c).mismatches)).toEqual([]);
	});

	describe("rounding bound", () => {
		it("holds its precondition: no early payoff for any case or corner", () => {
			const all = [...cases, ...domainCorners];
			expect(
				all.filter(
					(c) =>
						!noEarlyPayoff(BigInt(c.cents), BigInt(c.micros), c.years * 12),
				),
			).toEqual([]);
		});

		it("keeps ledger interest within the bound for every case", () => {
			expect(
				measured
					.filter((m) => !withinBound(m))
					.map((m) => `${m.loan} ${m.micros} ${m.n}`),
			).toEqual([]);
		});

		it("keeps ledger interest within the bound at every grid rate and term", () => {
			expect(
				domainCorners
					.map(measure)
					.filter((m) => !withinBound(m))
					.map((m) => `${m.loan} ${m.micros} ${m.n}`),
			).toEqual([]);
		});

		it("keeps ledger interest within $5 wherever the bound is at most $5", () => {
			const guaranteed = [...measured, ...domainCorners.map(measure)].filter(
				(m) => boundAtMost(m.bound, 500n),
			);
			expect(guaranteed.length).toBeGreaterThan(1000);
			expect(guaranteed.filter((m) => !withinCents(m, 500n))).toEqual([]);
		});

		it("shows an unconditional $5 limit is invalid: every case over $5 has a bound over $5", () => {
			const over = measured.filter((m) => !withinCents(m, 500n));
			// Seeded data: 180 cases exceed $5 against the exact closed form
			// (179 against the cent-rounded one, as first reported in #53).
			expect(over.length).toBeGreaterThan(0);
			expect(over.filter((m) => boundAtMost(m.bound, 500n))).toEqual([]);
		});

		it("is at most $5 for every 15-year rate, up to 8.375% at 20 years and 3.875% at 30", () => {
			const limit = (years: number, micros: number) =>
				boundAtMost(roundingBound(BigInt(micros), years * 12), 500n);
			expect(limit(15, 120_000)).toBe(true);
			expect(limit(20, 83_750)).toBe(true);
			expect(limit(20, 85_000)).toBe(false);
			expect(limit(30, 38_750)).toBe(true);
			expect(limit(30, 40_000)).toBe(false);
		});

		it("requires the precondition to be checked: a tiny loan can pay off early", () => {
			// $1,000 at 12% for 30 years: P* / (1 + r) is below S_(n-1), so the
			// bound's derivation does not apply and must not be assumed.
			expect(noEarlyPayoff(100_000n, 120_000n, 360)).toBe(false);
			expect(noEarlyPayoff(5_000_000n, 120_000n, 360)).toBe(true);
		});
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
