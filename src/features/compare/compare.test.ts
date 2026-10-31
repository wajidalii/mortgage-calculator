import { describe, expect, it } from "vitest";
import {
	buildCompareNotes,
	buildMetrics,
	type CompareState,
	deriveComparison,
	duplicateFirstScenario,
	initialCompareState,
	swapScenarios,
	upgradeLegacyCompare,
} from "./compare";

const withState = (patch: {
	a?: Partial<CompareState["scenarios"][0]>;
	b?: Partial<CompareState["scenarios"][1]>;
}): CompareState => ({
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

	it("keeps each loan independent: editing B leaves A untouched", () => {
		const before = deriveComparison(initialCompareState).scenarios;
		const after = deriveComparison(
			withState({ b: { homePrice: "600,000", interestRate: "7.25" } }),
		).scenarios;
		expect(after[0]).toEqual(before[0]);
		expect(after[1].summary?.loan.loanAmount).toBe(48_000_000);
		expect(after[1].summary?.payment).not.toBe(before[1].summary?.payment);
	});

	it("reports each loan's own errors", () => {
		const bad = deriveComparison(
			withState({ a: { homePrice: "" }, b: { interestRate: "abc" } }),
		);
		expect(bad.scenarios[0].errors.homePrice).toBeDefined();
		expect(bad.scenarios[0].summary).toBeNull();
		expect(bad.scenarios[1].errors.interestRate).toBeDefined();
		expect(bad.scenarios[1].errors.homePrice).toBeUndefined();
		const rate = deriveComparison(withState({ b: { interestRate: "31" } }));
		expect(rate.scenarios[1].errors.interestRate).toBeDefined();
		expect(rate.scenarios[0].summary).not.toBeNull();
	});

	it("itemizes monthly ownership cost from the calculator engine", () => {
		const [a] = deriveComparison(initialCompareState).scenarios;
		const estimate = a.summary?.estimate;
		expect(estimate?.lender[0]?.amount).toBe(a.summary?.payment);
		const sum = estimate?.lender.reduce((t, l) => t + l.amount, 0) ?? 0;
		expect(estimate?.lenderPayment).toBe(sum);
		expect(estimate?.total).toBeGreaterThan(a.summary?.payment ?? 0);
		// 20% down on $500,000: loan $400,000, cash to close is the down payment.
		expect(a.summary?.cashToClose).toBe(10_000_000);
	});

	it("adds PMI to the monthly cost only for the loan under 20% down", () => {
		const [a, b] = deriveComparison(
			withState({ b: { downPaymentPercent: "5" } }),
		).scenarios;
		const ids = (r: typeof a) => r.summary?.estimate?.lender.map((l) => l.id);
		expect(ids(a)).not.toContain("pmi");
		expect(ids(b)).toContain("pmi");
	});

	it("handles different terms, rates, prices and loan types", () => {
		for (const [aTerm, bTerm] of [
			[15, 20],
			[20, 30],
		] as const) {
			const [a, b] = deriveComparison(
				withState({
					a: { termYears: aTerm, homePrice: "350,000", interestRate: "5.75" },
					b: { termYears: bTerm, loanType: "arm", interestRate: "5.00" },
				}),
			).scenarios;
			expect(a.summary?.loan.termYears).toBe(aTerm);
			expect(b.summary?.isArm).toBe(true);
			expect(b.summary?.peakPayment).not.toBeNull();
			expect(a.summary?.lifetimeInterest).toBeGreaterThan(0);
		}
	});

	it("swaps and duplicates without mutating the input", () => {
		const snapshot = JSON.stringify(initialCompareState);
		const swapped = swapScenarios(initialCompareState);
		expect(swapped.scenarios[0]).toEqual(initialCompareState.scenarios[1]);
		expect(swapped.scenarios[1]).toEqual(initialCompareState.scenarios[0]);
		const copy = duplicateFirstScenario(initialCompareState);
		expect(copy.scenarios[1]).toEqual(initialCompareState.scenarios[0]);
		expect(copy.scenarios[1]).not.toBe(copy.scenarios[0]);
		expect(JSON.stringify(initialCompareState)).toBe(snapshot);
	});

	it("builds metrics that name the lower value and never rank the loans", () => {
		const metrics = buildMetrics(deriveComparison(initialCompareState));
		const byId = (id: string) => metrics.find((m) => m.id === id);
		expect(byId("payment")?.lower).toBe(1);
		expect(byId("lifetimeInterest")?.lower).toBe(0);
		expect(byId("cashToClose")?.lower).toBeNull();
		expect(byId("loanAmount")?.lower).toBeNull();
		expect(byId("payment")?.difference).toBe(348_443 - 252_827);
		const invalid = buildMetrics(
			deriveComparison(withState({ a: { homePrice: "" } })),
		);
		expect(
			invalid.every((m) => m.lower === null && m.difference === null),
		).toBe(true);
	});

	it("flags what differs and what is not equivalent", () => {
		const ids = (state: CompareState) =>
			buildCompareNotes(state, deriveComparison(state)).map((n) => n.id);
		expect(ids(initialCompareState)).toEqual(["term", "shared"]);
		const mixed = withState({
			a: { homePrice: "400,000" },
			b: { loanType: "arm", downPaymentPercent: "10" },
		});
		expect(ids(mixed)).toEqual(["price", "down", "term", "arm", "shared"]);
		const same = withState({ a: { termYears: 30 } });
		expect(ids(same)).toEqual(["shared"]);
	});

	it("upgrades a comparison saved with shared price and down payment", () => {
		const legacy = {
			shared: { homePrice: "650,000", downPaymentPercent: "10" },
			scenarios: [
				{
					loanType: "fixed",
					termYears: 15,
					interestRate: "6.00",
					armIndexPreset: "flat",
				},
				{
					loanType: "arm",
					termYears: 30,
					interestRate: "5.00",
					armIndexPreset: "shock",
				},
			],
		};
		const upgraded = upgradeLegacyCompare(legacy) as CompareState;
		expect(upgraded.scenarios[0].homePrice).toBe("650,000");
		expect(upgraded.scenarios[1].homePrice).toBe("650,000");
		expect(upgraded.scenarios[1].downPaymentPercent).toBe("10");
		expect(upgraded.scenarios[1].loanType).toBe("arm");
		expect(upgradeLegacyCompare(initialCompareState)).toBe(initialCompareState);
	});

	it("survives a JSON round trip", () => {
		const copy = JSON.parse(JSON.stringify(initialCompareState));
		expect(copy).toEqual(initialCompareState);
	});
});
