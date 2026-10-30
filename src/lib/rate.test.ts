import { describe, expect, it } from "vitest";
import type { Cents, Micros } from "../types/units";
import {
	formatPercent,
	formatRate,
	isInterestSafe,
	monthlyInterest,
	parseRate,
} from "./rate";

describe("parseRate", () => {
	it.each([
		["6.125", 61250],
		["6.5%", 65000],
		["6.5", 65000],
		["0", 0],
		["0.00005", 1],
		["0.00004", 0],
	])("parses %s to %i micros", (text, micros) => {
		expect(parseRate(text)).toEqual({ ok: true, value: micros });
	});

	it("returns errors for empty, invalid and negative text", () => {
		expect(parseRate("")).toEqual({ ok: false, error: "empty" });
		expect(parseRate("abc")).toEqual({ ok: false, error: "invalid" });
		expect(parseRate("-1")).toEqual({ ok: false, error: "negative" });
	});
});

describe("formatRate and formatPercent", () => {
	it("formats rates without losing precision", () => {
		expect(formatRate(61250 as Micros)).toBe("6.125%");
		expect(formatRate(65000 as Micros)).toBe("6.50%");
		expect(formatRate(0 as Micros)).toBe("0.00%");
	});

	it("formats fixed decimals, rounding half up", () => {
		expect(formatPercent(61250 as Micros)).toBe("6.13%");
		expect(formatPercent(65000 as Micros, 1)).toBe("6.5%");
		expect(formatPercent(65000 as Micros, 0)).toBe("7%");
		expect(formatPercent(500 as Micros, 2)).toBe("0.05%");
		expect(formatPercent(61250 as Micros, 4)).toBe("6.1250%");
	});
});

describe("monthlyInterest", () => {
	it("computes $400,000 at 6.50% as $2,166.67", () => {
		expect(monthlyInterest(40000000 as Cents, 65000 as Micros)).toBe(216667);
	});

	it("rounds an exact half cent up", () => {
		// 1 cent x 6,000,000 micros / 12,000,000 = 0.5 cent -> 1
		expect(monthlyInterest(1 as Cents, 6000000 as Micros)).toBe(1);
		// 3 x 2,000,000 / 12,000,000 = 0.5 -> 1
		expect(monthlyInterest(3 as Cents, 2000000 as Micros)).toBe(1);
		// just under half rounds down
		expect(monthlyInterest(1 as Cents, 5999999 as Micros)).toBe(0);
	});

	it("returns zero for a zero rate or balance", () => {
		expect(monthlyInterest(100 as Cents, 0 as Micros)).toBe(0);
		expect(monthlyInterest(0 as Cents, 65000 as Micros)).toBe(0);
	});
});

describe("overflow guard", () => {
	it("accepts a large but realistic loan", () => {
		expect(isInterestSafe(200_000_000_00 as Cents, 120000 as Micros)).toBe(
			true,
		);
	});

	it("rejects a balance and rate over the safe integer limit", () => {
		const balance = 40_000_000_000_000_00 as Cents;
		const rate = 120000 as Micros;
		expect(isInterestSafe(balance, rate)).toBe(false);
		expect(() => monthlyInterest(balance, rate)).toThrow(RangeError);
	});

	it("rejects at the exact boundary", () => {
		const rate = 100000 as Micros;
		const maxBalance = Math.floor(
			(Number.MAX_SAFE_INTEGER - 12_000_000) / (2 * rate),
		);
		expect(isInterestSafe(maxBalance as Cents, rate)).toBe(true);
		expect(isInterestSafe((maxBalance + 1) as Cents, rate)).toBe(false);
	});
});
