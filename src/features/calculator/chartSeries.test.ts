import { describe, expect, it } from "vitest";
import { buildSchedule, lifetimeInterest } from "@/lib/amortization";
import { parseRate } from "@/lib/rate";
import type { Cents } from "@/types/units";
import { buildBalanceSeries } from "./chartSeries";

const rate = (text: string) => {
	const parsed = parseRate(text);
	if (!parsed.ok) throw new Error("bad rate");
	return parsed.value;
};
const golden = buildSchedule({
	loan: 40_000_000 as Cents,
	rate: rate("6.5"),
	payments: 360,
});

describe("buildBalanceSeries", () => {
	it("returns null for an empty schedule", () => {
		expect(buildBalanceSeries([])).toBeNull();
	});

	it("starts at the loan amount and ends at a $0 balance", () => {
		const series = buildBalanceSeries(golden);
		expect(series?.startBalance).toBe(40_000_000);
		expect(series?.points).toHaveLength(31); // start + 30 loan years
		expect(series?.points[0]).toEqual({
			month: 0,
			balance: 40_000_000,
			interestPaid: 0,
		});
		expect(series?.points.at(-1)?.balance).toBe(0);
	});

	it("reports the same lifetime interest as the ledger", () => {
		const series = buildBalanceSeries(golden);
		expect(series?.totalInterest).toBe(lifetimeInterest(golden));
		expect(series?.points.at(-1)?.interestPaid).toBe(lifetimeInterest(golden));
		expect(series?.hypotheticalFrom).toBeNull();
	});

	it("keeps the last month when the term is not whole years", () => {
		const series = buildBalanceSeries(golden.slice(0, 18));
		expect(series?.points.map((point) => point.month)).toEqual([0, 12, 18]);
	});

	it("finds the first hypothetical-rate month", () => {
		const rows = golden.map((row) => ({
			...row,
			hypothetical: row.month > 60,
		}));
		expect(buildBalanceSeries(rows)?.hypotheticalFrom).toBe(61);
	});
});
