import { describe, expect, it } from "vitest";
import type { Cents, Micros } from "@/types/units";
import {
	buildSchedule,
	lifetimeInterest,
	type ScheduleRow,
	summarizeByYear,
} from "./amortization";
import { monthlyPayment } from "./payment";

const build = (dollars: number, micros: number, years: number) =>
	buildSchedule({
		loan: (dollars * 100) as Cents,
		rate: micros as Micros,
		payments: years * 12,
	});

describe("buildSchedule golden cases (PRD 12.1)", () => {
	it.each([
		[30, 51_017_981],
		[20, 31_575_075],
		[15, 22_719_724],
	])(
		"$400,000 at 6.50% over %i years has lifetime interest %i cents",
		(years, cents) => {
			const rows = build(400_000, 65_000, years);
			expect(rows).toHaveLength(years * 12);
			expect(lifetimeInterest(rows)).toBe(cents);
			expect(rows.at(-1)?.balance).toBe(0);
		},
	);

	it("matches an independent first and last row for the 30 year loan", () => {
		// From a separate Python Fraction ledger, not from this module.
		const rows = build(400_000, 65_000, 30);
		expect(rows[0]).toEqual({
			month: 1,
			payment: 252_827,
			interest: 216_667,
			principal: 36_160,
			extra: 0,
			balance: 39_963_840,
		});
		expect(rows.at(-1)).toEqual({
			month: 360,
			payment: 253_088,
			interest: 1_364,
			principal: 251_724,
			extra: 0,
			balance: 0,
		});
	});

	it("lets the final payment differ from PI by $2.61", () => {
		const rows = build(400_000, 65_000, 30);
		expect((rows.at(-1)?.payment ?? 0) - 252_827).toBe(261);
	});
});

const invariants = (rows: ScheduleRow[], loan: number) => {
	let previous = loan;
	let principal = 0;
	for (const row of rows) {
		expect(row.balance).toBe(previous - row.principal - row.extra);
		expect(row.payment).toBe(row.interest + row.principal + row.extra);
		expect(row.balance).toBeGreaterThanOrEqual(0);
		previous = row.balance;
		principal += row.principal + row.extra;
	}
	expect(principal).toBe(loan);
	expect(rows.at(-1)?.balance ?? 0).toBe(0);
};

describe("buildSchedule invariants", () => {
	it("repays exactly the loan and ends at $0 across terms, rates and sizes", () => {
		for (const years of [15, 20, 30]) {
			for (let micros = 0; micros <= 120_000; micros += 12_500) {
				for (const cents of [1, 99, 5_000_000, 12_345_678, 200_000_000]) {
					const rows = buildSchedule({
						loan: cents as Cents,
						rate: micros as Micros,
						payments: years * 12,
					});
					invariants(rows, cents);
				}
			}
		}
	});

	it("keeps the regular payment at PI until the last month", () => {
		const rows = build(400_000, 65_000, 30);
		const pi = monthlyPayment(40_000_000 as Cents, 65_000 as Micros, 360);
		expect(rows.slice(0, -1).every((row) => row.payment === pi)).toBe(true);
	});

	it("returns no rows for a $0 loan", () => {
		expect(build(0, 65_000, 30)).toEqual([]);
	});

	it("splits a 0% loan evenly with no interest", () => {
		const rows = build(1_200, 0, 1);
		expect(lifetimeInterest(rows)).toBe(0);
		expect(rows.every((row) => row.principal === 10_000)).toBe(true);
	});
});

describe("buildSchedule extra payment hook", () => {
	const monthlyExtra = (cents: number) => () => cents;

	it("pays off in month 293 and saves $111,892.52 with $200 extra (PRD 12.1)", () => {
		const base = build(400_000, 65_000, 30);
		const rows = buildSchedule({
			loan: 40_000_000 as Cents,
			rate: 65_000 as Micros,
			payments: 360,
			extra: monthlyExtra(20_000),
		});
		expect(rows).toHaveLength(293);
		expect(lifetimeInterest(base) - lifetimeInterest(rows)).toBe(11_189_252);
		invariants(rows, 40_000_000);
	});

	it("ignores negative extra and caps extra at the remaining balance", () => {
		const negative = buildSchedule({
			loan: 40_000_000 as Cents,
			rate: 65_000 as Micros,
			payments: 360,
			extra: () => -500,
		});
		expect(negative).toEqual(build(400_000, 65_000, 30));

		const huge = buildSchedule({
			loan: 1_000_000 as Cents,
			rate: 65_000 as Micros,
			payments: 360,
			extra: (month) => (month === 3 ? 999_999_999 : 0),
		});
		expect(huge).toHaveLength(3);
		expect(huge.at(-1)?.balance).toBe(0);
		invariants(huge, 1_000_000);
	});
});

describe("summarizeByYear", () => {
	const rows = build(400_000, 65_000, 30);
	const years = summarizeByYear(rows);

	it("has one row per loan year", () => {
		expect(years).toHaveLength(30);
		expect(years.map((year) => year.year)).toEqual(
			Array.from({ length: 30 }, (_, i) => i + 1),
		);
	});

	it("makes each year the sum of its 12 months", () => {
		years.forEach((year, index) => {
			const months = rows.slice(index * 12, index * 12 + 12);
			const sum = (pick: (row: ScheduleRow) => number) =>
				months.reduce((total, row) => total + pick(row), 0);
			expect(year.payment).toBe(sum((row) => row.payment));
			expect(year.interest).toBe(sum((row) => row.interest));
			expect(year.principal).toBe(sum((row) => row.principal));
			expect(year.balance).toBe(months.at(-1)?.balance);
		});
	});

	it("keeps lifetime totals the same as the monthly view", () => {
		expect(years.reduce((total, year) => total + year.interest, 0)).toBe(
			lifetimeInterest(rows),
		);
	});

	it("handles a partial final year", () => {
		const short = summarizeByYear(build(100_000, 65_000, 1).slice(0, 5));
		expect(short).toHaveLength(1);
		expect(short[0]?.balance).toBeGreaterThan(0);
	});
});
