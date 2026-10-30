import { describe, expect, it } from "vitest";
import type { Cents } from "../types/units";
import { formatMoney, parseMoney } from "./money";
import { roundHalfUp } from "./rounding";

describe("parseMoney (PRD 12.2)", () => {
	it.each([
		["1.005", 101],
		["19.99", 1999],
		["0.1", 10],
		["1,234.5", 123450],
		["$400,000", 40000000],
		["5.", 500],
		[".5", 50],
		["0", 0],
		["1.004", 100],
		["1.0049999", 100],
	])("parses %s to %i cents", (text, cents) => {
		expect(parseMoney(text)).toEqual({ ok: true, value: cents });
	});

	it.each([
		["1,234,567.89", 123456789],
		["$1,000", 100000],
		["999", 99900],
	])("accepts valid thousands grouping %s", (text, cents) => {
		expect(parseMoney(text)).toEqual({ ok: true, value: cents });
	});

	it.each([
		"1,2,3",
		"1,,000",
		",1",
		"12,34",
		"1,234,5",
		"1,234,",
		"1.234,5",
		"1,000.5,0",
	])("rejects malformed thousands grouping %s", (text) => {
		expect(parseMoney(text)).toEqual({ ok: false, error: "invalid" });
	});

	it("still reports negatives with valid grouping as negative", () => {
		expect(parseMoney("-1,234")).toEqual({ ok: false, error: "negative" });
	});

	it("returns an explicit empty result", () => {
		expect(parseMoney("")).toEqual({ ok: false, error: "empty" });
		expect(parseMoney("   ")).toEqual({ ok: false, error: "empty" });
	});

	it("rejects non-numeric and negative text", () => {
		expect(parseMoney("abc")).toEqual({ ok: false, error: "invalid" });
		expect(parseMoney("1.2.3")).toEqual({ ok: false, error: "invalid" });
		expect(parseMoney(".")).toEqual({ ok: false, error: "invalid" });
		expect(parseMoney("-5")).toEqual({ ok: false, error: "negative" });
	});

	it("rejects values beyond the safe integer range", () => {
		expect(parseMoney("99999999999999999999")).toEqual({
			ok: false,
			error: "too-large",
		});
	});
});

describe("roundHalfUp", () => {
	it("rounds exact halves up", () => {
		expect(roundHalfUp(5, 10)).toBe(1);
		expect(roundHalfUp(15, 10)).toBe(2);
		expect(roundHalfUp(25, 10)).toBe(3);
	});

	it("rounds below half down and above half up", () => {
		expect(roundHalfUp(4, 10)).toBe(0);
		expect(roundHalfUp(6, 10)).toBe(1);
		expect(roundHalfUp(0, 7)).toBe(0);
	});

	it("rejects invalid input and overflow", () => {
		expect(() => roundHalfUp(-1, 10)).toThrow(RangeError);
		expect(() => roundHalfUp(1.5, 10)).toThrow(RangeError);
		expect(() => roundHalfUp(1, 0)).toThrow(RangeError);
		expect(() => roundHalfUp(Number.MAX_SAFE_INTEGER, 10)).toThrow(RangeError);
	});
});

describe("formatMoney", () => {
	it.each([
		[0, "$0.00"],
		[5, "$0.05"],
		[1999, "$19.99"],
		[252827, "$2,528.27"],
		[40000000, "$400,000.00"],
	])("formats %i cents as %s", (cents, text) => {
		expect(formatMoney(cents as Cents)).toBe(text);
	});
});
