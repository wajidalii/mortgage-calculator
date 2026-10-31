import { describe, expect, it } from "vitest";
import {
	type CompareState,
	deriveComparison,
	initialCompareState,
} from "./compare";

const withState = (patch: {
	shared?: Partial<CompareState["shared"]>;
	a?: Partial<CompareState["scenarios"][0]>;
	b?: Partial<CompareState["scenarios"][1]>;
}): CompareState => ({
	shared: { ...initialCompareState.shared, ...patch.shared },
	scenarios: [
		{ ...initialCompareState.scenarios[0], ...patch.a },
		{ ...initialCompareState.scenarios[1], ...patch.b },
	],
});

describe("deriveComparison", () => {
	it("compares 15 and 30 year fixed on $400,000 at 6.50%", () => {
		const [a, b] = deriveComparison(initialCompareState).scenarios;
		expect(a.summary?.payment).toBe(348_443);
		expect(b.summary?.payment).toBe(252_827);
		expect(a.summary?.lifetimeInterest).toBe(22_719_724);
		expect(b.summary?.lifetimeInterest).toBe(51_017_981);
		expect(a.summary?.isArm).toBe(false);
	});

	it("carries ARM details for an ARM column", () => {
		const [a, b] = deriveComparison(
			withState({ b: { loanType: "arm", armIndexPreset: "shock" } }),
		).scenarios;
		expect(a.summary?.isArm).toBe(false);
		expect(b.summary?.isArm).toBe(true);
		expect(b.summary?.peakPayment).toBeGreaterThan(b.summary?.payment ?? 0);
	});

	it("recalculates both columns when a shared input changes", () => {
		const before = deriveComparison(initialCompareState).scenarios;
		const after = deriveComparison(
			withState({ shared: { homePrice: "600,000" } }),
		).scenarios;
		expect(after[0].summary?.payment).not.toBe(before[0].summary?.payment);
		expect(after[1].summary?.payment).not.toBe(before[1].summary?.payment);
		expect(after[0].summary?.loan.loanAmount).toBe(48_000_000);
	});

	it("reports shared and per-column errors separately", () => {
		const bad = deriveComparison(
			withState({ shared: { homePrice: "" }, b: { interestRate: "abc" } }),
		);
		expect(bad.sharedErrors.homePrice).toBeDefined();
		expect(bad.scenarios[0].summary).toBeNull();
		const rate = deriveComparison(withState({ b: { interestRate: "31" } }));
		expect(rate.sharedErrors).toEqual({});
		expect(rate.scenarios[1].errors.interestRate).toBeDefined();
		expect(rate.scenarios[0].summary).not.toBeNull();
	});

	it("survives a JSON round trip", () => {
		const copy = JSON.parse(JSON.stringify(initialCompareState));
		expect(copy).toEqual(initialCompareState);
	});
});
