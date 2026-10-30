import { describe, expect, it } from "vitest";
import { DEFAULTS } from "@/config/defaults/defaults";
import type { Cents, Micros } from "@/types/units";
import { buildSchedule, lifetimeInterest } from "./amortization";
import {
	ARM_RATE_STEP,
	type ArmParams,
	type ArmRow,
	armParamsFromTerms,
	buildArmSchedule,
	flatIndex,
	type IndexPath,
	resetRate,
	risingIndex,
	stepIndex,
} from "./arm";

const m = (value: number) => value as Micros;
const c = (value: number) => value as Cents;

const params = armParamsFromTerms(DEFAULTS.armTerms.value);
const LOAN = c(40_000_000);
const START = m(65_000);
const FLAT = m(37_500); // 3.75% + 2.75% margin = the 6.50% start rate

const run = (
	indexPath: IndexPath,
	overrides: Partial<ArmParams> = {},
	extra?: (month: number) => number,
	loan = LOAN,
	start = START,
	payments = 360,
) =>
	buildArmSchedule({
		loan,
		startRate: start,
		payments,
		params: { ...params, ...overrides },
		indexPath,
		...(extra ? { extra } : {}),
	});

const resetRows = (rows: ArmRow[]) => rows.filter((row) => row.reset);

/** Independent exact PI (BigInt, divmod rounding) for the reset check. */
const referencePayment = (loan: number, micros: number, n: number): number => {
	const den = 12_000_000n;
	const growth = (den + BigInt(micros)) ** BigInt(n);
	const num = BigInt(loan) * BigInt(micros) * growth;
	const dd = den * (growth - den ** BigInt(n));
	const q = num / dd;
	return Number((num % dd) * 2n >= dd ? q + 1n : q);
};

describe("ARM parameters from the registry", () => {
	it("uses 2.75% margin, 2/1/5 caps, a floor equal to the margin, 60/6 months", () => {
		expect(params).toEqual({
			fixedMonths: 60,
			intervalMonths: 6,
			initialCap: 20_000,
			periodicCap: 10_000,
			lifetimeCap: 50_000,
			margin: 27_500,
			floor: 27_500,
		});
	});
});

describe("golden cases ($400,000, 6.50% start, 30 years, caps 2/1/5)", () => {
	it("flat 3.75% index: rate stays 6.50% and payment stays $2,528.27", () => {
		const rows = run(flatIndex(FLAT));
		expect(rows.every((row) => row.rate === 65_000)).toBe(true);
		expect(resetRows(rows)[0]?.scheduledPayment).toBe(252_827);
		// Each reset recomputes PI from the real balance, which carries cent
		// rounding, so later payments can move by a cent: $2,528.27 or $2,528.28.
		expect(
			rows.every((row) => Math.abs(row.scheduledPayment - 252_827) <= 1),
		).toBe(true);
		expect(rows).toHaveLength(360);
	});

	it("shock to 9.00% from month 61: 8.50, 9.50, 10.50, then 11.50; first reset $3,015.13", () => {
		const resets = resetRows(run(stepIndex(FLAT, m(90_000), 61)));
		expect(resets.slice(0, 4).map((row) => row.rate)).toEqual([
			85_000, 95_000, 105_000, 115_000,
		]);
		expect(resets.slice(0, 4).map((row) => row.month)).toEqual([
			61, 67, 73, 79,
		]);
		expect(resets[0]?.scheduledPayment).toBe(301_513);
		// 9.00% + 2.75% = 11.75% targets, but the lifetime ceiling is 11.50%.
		expect(resets.slice(3).every((row) => row.rate === 115_000)).toBe(true);
	});

	it("crash to 0.50% from month 61: 4.50, 3.50, then 3.25; never below the floor", () => {
		const rows = run(stepIndex(FLAT, m(5_000), 61));
		const resets = resetRows(rows);
		expect(resets.slice(0, 3).map((row) => row.rate)).toEqual([
			45_000, 35_000, 32_500,
		]);
		expect(rows.slice(60).every((row) => row.rate >= params.floor)).toBe(true);
	});

	it("holds the rate at the floor when the target is below it", () => {
		// index 0 + 2.75% = 2.75% = the floor, reached after 4.50 -> 3.50 -> 2.75 (not 2.50).
		const rates = resetRows(run(stepIndex(FLAT, m(0), 61))).map((r) => r.rate);
		expect(rates.slice(0, 3)).toEqual([45_000, 35_000, 27_500]);
		expect(Math.min(...rates)).toBe(27_500);
	});
});

describe("reset uses the current balance and remaining months", () => {
	it("recomputes PI with an independent BigInt formula at every reset", () => {
		const paths: IndexPath[] = [
			stepIndex(FLAT, m(90_000), 61),
			stepIndex(FLAT, m(5_000), 61),
			risingIndex(FLAT, m(10_000), 61),
		];
		for (const path of paths) {
			const rows = run(path);
			for (const row of resetRows(rows)) {
				const before = rows[row.month - 2]?.balance as number;
				expect(row.scheduledPayment).toBe(
					referencePayment(before, row.rate, 360 - row.month + 1),
				);
			}
		}
	});

	it("never restarts the term: the loan still ends in month 360", () => {
		const rows = run(stepIndex(FLAT, m(90_000), 61));
		expect(rows.at(-1)?.month).toBe(360);
		expect(rows.at(-1)?.balance).toBe(0);
	});

	it("uses a lower balance after extra payments", () => {
		const base = run(stepIndex(FLAT, m(90_000), 61));
		const extra = run(stepIndex(FLAT, m(90_000), 61), {}, () => 50_000);
		expect(resetRows(extra)[0]?.scheduledPayment).toBeLessThan(
			resetRows(base)[0]?.scheduledPayment as number,
		);
	});
});

describe("reset calendar and labels", () => {
	it("resets in months 61, 67, 73, ... and only then", () => {
		const months = resetRows(run(flatIndex(FLAT))).map((row) => row.month);
		expect(months.slice(0, 4)).toEqual([61, 67, 73, 79]);
		expect(months.every((month) => (month - 61) % 6 === 0)).toBe(true);
		expect(months).toHaveLength(50);
	});

	it("marks every month after month 60 as hypothetical, and none before", () => {
		const rows = run(flatIndex(FLAT));
		expect(rows.filter((row) => row.hypothetical)).toHaveLength(300);
		expect(rows[59]?.hypothetical).toBe(false);
		expect(rows[60]?.hypothetical).toBe(true);
	});

	it("honors other fixed periods and intervals", () => {
		const rows = run(flatIndex(FLAT), { fixedMonths: 36, intervalMonths: 12 });
		expect(
			resetRows(rows)
				.slice(0, 3)
				.map((row) => row.month),
		).toEqual([37, 49, 61]);
	});

	it("never resets when the fixed period covers the term", () => {
		const rows = run(flatIndex(m(90_000)), { fixedMonths: 360 });
		expect(resetRows(rows)).toEqual([]);
		expect(rows.some((row) => row.hypothetical)).toBe(false);
	});
});

describe("resetRate", () => {
	const reset = (index: number, prev = 65_000, cap = 20_000, over = {}) =>
		resetRate(m(index), m(prev), START, m(cap), { ...params, ...over });

	it("rounds index + margin to the nearest 0.125%", () => {
		expect(reset(38_000, 65_000, 100_000)).toBe(65_000); // 6.50%
		expect(reset(37_700, 65_000, 100_000)).toBe(65_000); // 6.45% -> 6.50%
		expect(reset(38_124, 65_000, 100_000)).toBe(65_000); // 6.5249% -> 6.50%
		expect(reset(38_125, 65_000, 100_000)).toBe(66_250); // 6.525% rounds half up
		expect(reset(38_125, 65_000, 100_000) % ARM_RATE_STEP).toBe(0);
	});

	it("applies the initial cap against the previous rate", () => {
		expect(reset(90_000, 65_000, 20_000)).toBe(85_000);
		expect(reset(0, 65_000, 20_000)).toBe(45_000);
	});

	it("applies the lifetime ceiling and lower bound against the start rate", () => {
		expect(reset(200_000, 110_000, 10_000)).toBe(115_000);
		expect(reset(200_000, 115_000, 10_000)).toBe(115_000);
		// start 6.50% - 5 = 1.50% would bind, but the 2.75% floor is higher.
		expect(reset(0, 30_000, 10_000)).toBe(27_500);
		// With margin and floor at 0 the target is 0, so the lower bounds decide:
		const open = { margin: m(0), floor: m(0) };
		expect(reset(0, 30_000, 10_000, open)).toBe(20_000); // previous - cap
		expect(reset(0, 16_000, 10_000, open)).toBe(15_000); // start - lifetime cap
	});

	it("lets the caps win when the floor is above the highest allowed rate", () => {
		expect(reset(0, 65_000, 20_000, { floor: m(200_000) })).toBe(85_000);
	});

	it("handles a negative index and rounds a zero target to the floor", () => {
		expect(reset(-100_000, 30_000, 10_000)).toBe(27_500);
	});
});

describe("validation", () => {
	const attempt =
		(over: Partial<ArmParams>, start: number = START) =>
		() =>
			run(flatIndex(FLAT), over, undefined, LOAN, m(start));

	it("rejects any cap or margin above 100%", () => {
		expect(attempt({ initialCap: m(1_000_001) })).toThrow(RangeError);
		expect(attempt({ periodicCap: m(1_000_001) })).toThrow(RangeError);
		expect(attempt({ lifetimeCap: m(1_000_001) })).toThrow(RangeError);
		expect(attempt({ margin: m(1_000_001) })).toThrow(RangeError);
		expect(attempt({ initialCap: m(1_000_000) })).not.toThrow();
	});

	it("rejects negative and non-integer values", () => {
		expect(attempt({ periodicCap: m(-1) })).toThrow(RangeError);
		expect(attempt({ floor: m(-1) })).toThrow(RangeError);
		expect(attempt({ margin: m(27_500.5) })).toThrow(RangeError);
		expect(attempt({}, -1)).toThrow(RangeError);
		expect(attempt({ intervalMonths: 0 })).toThrow(RangeError);
		expect(attempt({ fixedMonths: -1 })).toThrow(RangeError);
		expect(attempt({ fixedMonths: 60.5 })).toThrow(RangeError);
	});

	it("rejects a non-integer index", () => {
		expect(() => run(() => m(1.5))).toThrow(RangeError);
	});
});

/** mulberry32, fixed seed. */
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

/** Checks every ledger and cap invariant of an ARM run. */
const checkInvariants = (
	rows: ArmRow[],
	loan: number,
	start: number,
	p: ArmParams,
	extraTotal = 0,
) => {
	expect(rows.at(-1)?.balance).toBe(0);
	const principal = rows.reduce((t, row) => t + row.principal + row.extra, 0);
	expect(principal).toBe(loan);
	expect(extraTotal).toBe(rows.reduce((t, row) => t + row.extra, 0));
	let prev = start;
	let resets = 0;
	for (const row of rows) {
		expect(row.hypothetical).toBe(row.month > p.fixedMonths);
		if (!row.reset) {
			expect(row.rate).toBe(prev);
			continue;
		}
		const cap = resets === 0 ? p.initialCap : p.periodicCap;
		expect(Math.abs(row.rate - prev)).toBeLessThanOrEqual(cap);
		expect(row.rate).toBeLessThanOrEqual(start + p.lifetimeCap);
		expect(row.rate).toBeGreaterThanOrEqual(0);
		// The floor and the lifetime lower bound hold unless the caps override them.
		const lowest = Math.max(prev - cap, p.floor, start - p.lifetimeCap);
		const highest = Math.min(prev + cap, start + p.lifetimeCap);
		if (lowest <= highest) expect(row.rate).toBeGreaterThanOrEqual(lowest);
		prev = row.rate;
		resets++;
	}
};

describe("ARM invariants (PRD 12.2)", () => {
	const named: [string, IndexPath][] = [
		["flat", flatIndex(FLAT)],
		["rising +1 point a year", risingIndex(FLAT, m(10_000), 61)],
		["shock", stepIndex(FLAT, m(90_000), 61)],
		["crash", stepIndex(FLAT, m(5_000), 61)],
	];

	for (const [name, path] of named) {
		it(`holds every cap, the ledger and the final balance on the ${name} path`, () => {
			checkInvariants(run(path), LOAN, START, params);
		});
	}

	it("holds over 300 seeded random loans, terms, caps and index walks", () => {
		const random = makeRandom(20261031);
		const int = (lo: number, hi: number) =>
			lo + Math.floor(random() * (hi - lo + 1));
		for (let n = 0; n < 300; n++) {
			const years = ([15, 20, 30] as const)[int(0, 2)] ?? 30;
			const p: ArmParams = {
				...params,
				initialCap: m(int(0, 6) * 10_000),
				periodicCap: m(int(0, 3) * 10_000),
				lifetimeCap: m(int(1, 8) * 10_000),
				margin: m(int(0, 5) * 12_500),
				floor: m(int(0, 5) * 12_500),
				fixedMonths: ([36, 60, 84] as const)[int(0, 2)] ?? 60,
			};
			const start = m(20_000 + int(0, 80) * 1_250);
			const loan = c(int(5_000_000, 200_000_000));
			// A random walk: each reset month gets an independent index in 0% to 15%.
			const walk = new Map<number, Micros>();
			const path: IndexPath = (month) => {
				if (!walk.has(month)) walk.set(month, m(int(0, 150_000)));
				return walk.get(month) as Micros;
			};
			const rows = run(path, p, undefined, loan, start, years * 12);
			expect(rows).toHaveLength(years * 12);
			checkInvariants(rows, loan, start, p);
		}
	});

	it("keeps the ledger exact with extra payments", () => {
		const extra = (month: number) => (month % 5 === 0 ? 20_000 : 0);
		const rows = run(stepIndex(FLAT, m(90_000), 61), {}, extra);
		const extraTotal = rows.reduce((t, row) => t + row.extra, 0);
		expect(extraTotal).toBeGreaterThan(0);
		checkInvariants(rows, LOAN, START, params, extraTotal);
		expect(rows.length).toBeLessThanOrEqual(360);
	});
});

describe("flat-index ARM vs the fixed loan", () => {
	it("differs by $1.32 of lifetime interest on the reference loan (PRD 12.2 prototype)", () => {
		const arm = run(flatIndex(FLAT));
		const fixed = buildSchedule({ loan: LOAN, rate: START, payments: 360 });
		expect(Math.abs(lifetimeInterest(arm) - lifetimeInterest(fixed))).toBe(132);
	});

	it("stays within the fixed-ledger rounding bound across seeded loans (regression guard)", () => {
		// PRD 12.2 "a few dollars" depends on rate and term, like the closed-form
		// tolerance. T = S - n/2 cents is proven for the FIXED ledger vs closed form;
		// it is not proven for an ARM, so this is an empirical guard, not a theorem.
		const random = makeRandom(7);
		for (let n = 0; n < 300; n++) {
			const years = ([15, 20, 30] as const)[Math.floor(random() * 3)] ?? 30;
			const loan = c(5_000_000 + Math.floor(random() * 195_000_001));
			const rate = m(20_000 + Math.floor(random() * 81) * 1_250);
			const payments = years * 12;
			// A zero floor keeps the rate flat even below the 2.75% margin.
			const arm = run(
				flatIndex(m(rate - params.margin)),
				{ floor: m(0) },
				undefined,
				loan,
				rate,
				payments,
			);
			const fixed = buildSchedule({ loan, rate, payments });
			const monthly = rate / 12_000_000;
			const bound = ((1 + monthly) ** payments - 1) / monthly - payments / 2;
			expect(
				Math.abs(lifetimeInterest(arm) - lifetimeInterest(fixed)),
			).toBeLessThanOrEqual(bound);
		}
	});
});
