import { describe, expect, it } from "vitest";
import { monthlyPayment } from "@/lib/payment";
import { buildHomePreview } from "./preview";

describe("buildHomePreview", () => {
	const preview = buildHomePreview();

	it("describes a sensible $500,000, 6.5%, 30-year sample loan", () => {
		expect(preview.loan).toBe(40_000_000);
		const pi = preview.lines[0]?.amount ?? 0;
		expect(pi).toBeGreaterThan(250_000);
		expect(pi).toBeLessThan(260_000);
		expect(preview.lifetimeInterest).toBeLessThan(preview.loan * 1.5);
	});

	it("takes principal and interest from the app's payment function", () => {
		const pi = preview.lines.find((line) => line.id === "pi");
		expect(pi?.amount).toBe(monthlyPayment(preview.loan, preview.rate, 360));
	});

	it("totals exactly the lines it shows", () => {
		const sum = preview.lines.reduce((total, line) => total + line.amount, 0);
		expect(preview.total).toBe(sum);
	});

	it("keeps the shares near 100 percent for the donut", () => {
		const shares = preview.lines.reduce(
			(total, line) => total + line.percent,
			0,
		);
		expect(shares).toBeGreaterThanOrEqual(99);
		expect(shares).toBeLessThanOrEqual(101);
	});

	it("draws a balance curve from the full loan down to zero", () => {
		expect(preview.balanceCurve[0]).toBeCloseTo(1, 10);
		expect(preview.balanceCurve.at(-1)).toBeCloseTo(0, 10);
	});
});
