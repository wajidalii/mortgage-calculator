import { describe, expect, it } from "vitest";
import type { Cents, Micros } from "@/types/units";
import { monthlyPayment } from "./payment";

const pay = (dollars: number, micros: number, years: number) =>
	monthlyPayment((dollars * 100) as Cents, micros as Micros, years * 12);

describe("monthlyPayment golden cases (PRD 12.1)", () => {
	it.each([
		[30, 252_827],
		[20, 298_229],
		[15, 348_443],
	])("$400,000 at 6.50% over %i years is %i cents", (years, cents) => {
		expect(pay(400_000, 65_000, years)).toBe(cents);
	});

	it("divides the loan by the number of payments at 0%", () => {
		expect(pay(400_000, 0, 30)).toBe(111_111);
	});

	it("is $0 for a $0 loan, with or without a rate", () => {
		expect(pay(0, 65_000, 30)).toBe(0);
		expect(pay(0, 0, 30)).toBe(0);
	});
});

describe("monthlyPayment edge cases", () => {
	it("rounds the 0% division half up", () => {
		expect(monthlyPayment(5 as Cents, 0 as Micros, 2)).toBe(3); // 2.5 -> 3
		expect(monthlyPayment(100_000 as Cents, 0 as Micros, 360)).toBe(278);
	});

	it("handles a one-payment loan: principal plus one month of interest", () => {
		// $1,000.00 at 12% for 1 month: 1,000.00 x 1.01 = 1,010.00
		expect(monthlyPayment(100_000 as Cents, 120_000 as Micros, 1)).toBe(
			101_000,
		);
	});

	it("handles a very small rate and a very small loan", () => {
		expect(monthlyPayment(1 as Cents, 1 as Micros, 360)).toBe(0);
		expect(monthlyPayment(100 as Cents, 65_000 as Micros, 360)).toBe(1);
	});

	it("handles the largest supported loan at a high rate", () => {
		// $10,000,000 at 30% for 30 years, from an exact Fraction reference.
		expect(pay(10_000_000, 300_000, 30)).toBe(25_003_447);
	});

	it("matches an exact rational reference at 5.5% and 7.5%", () => {
		expect(pay(400_000, 55_000, 30)).toBe(227_116);
		expect(pay(400_000, 75_000, 30)).toBe(279_686);
	});

	it("rejects invalid arguments", () => {
		expect(() => monthlyPayment(-1 as Cents, 0 as Micros, 360)).toThrow(
			RangeError,
		);
		expect(() => monthlyPayment(1.5 as Cents, 0 as Micros, 360)).toThrow(
			RangeError,
		);
		expect(() => monthlyPayment(1 as Cents, -1 as Micros, 360)).toThrow(
			RangeError,
		);
		expect(() => monthlyPayment(1 as Cents, 0 as Micros, 0)).toThrow(
			RangeError,
		);
		expect(() => monthlyPayment(1 as Cents, 0 as Micros, 1201)).toThrow(
			RangeError,
		);
		expect(() => monthlyPayment(1 as Cents, 0 as Micros, 1.5)).toThrow(
			RangeError,
		);
	});
});

describe("monthlyPayment against an independent decimal reference", () => {
	// Float reference, used only as a sanity check within 1 cent.
	const reference = (loan: number, micros: number, n: number) => {
		const r = micros / 12_000_000;
		return (loan * r) / (1 - (1 + r) ** -n);
	};

	it("stays within one cent of the float formula across terms and rates", () => {
		for (const years of [15, 20, 30]) {
			for (let micros = 20_000; micros <= 120_000; micros += 1250) {
				for (const dollars of [50_000, 123_456, 750_000, 2_000_000]) {
					const loan = dollars * 100;
					const exact = monthlyPayment(
						loan as Cents,
						micros as Micros,
						years * 12,
					);
					expect(
						Math.abs(exact - reference(loan, micros, years * 12)),
					).toBeLessThanOrEqual(1);
				}
			}
		}
	});
});
