import { describe, expect, it } from "vitest";
import { buildSchedule } from "@/lib/amortization";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveLoan } from "./loanMath";
import { deriveMonthlyCosts } from "./monthlyCosts";
import { buildMonthlyEstimate, type MonthlyEstimate } from "./monthlyEstimate";
import { derivePmi } from "./pmi";
import { derivePropertyTax } from "./propertyTax";
import type { CalculatorInputs } from "./types";

const estimateFor = (i: CalculatorInputs): MonthlyEstimate | null => {
	const { loan } = deriveLoan(i);
	const schedule = loan
		? buildSchedule({
				loan: loan.loanAmount,
				rate: loan.interestRate,
				payments: loan.termYears * 12,
			})
		: null;
	return buildMonthlyEstimate(
		loan,
		derivePropertyTax(i).tax,
		deriveMonthlyCosts(i).costs,
		derivePmi(i, loan, schedule).result,
	);
};

const golden: CalculatorInputs = {
	...initialCalculatorState.inputs,
	homePrice: "500,000",
	downPaymentPercent: "20",
	interestRate: "6.5",
	termYears: 30,
	state: "NJ",
	annualInsurance: "1800",
	monthlyHoa: "100",
};

const amounts = (lines: { id: string; amount: number }[]) =>
	Object.fromEntries(lines.map((l) => [l.id, l.amount]));

describe("buildMonthlyEstimate golden case", () => {
	it("itemizes $500,000, 20% down, 6.50%, 30 years, NJ, $1,800 insurance, $100 HOA", () => {
		const e = estimateFor(golden);
		expect(e).not.toBeNull();
		expect(amounts(e?.lender ?? [])).toEqual({
			pi: 252_827,
			tax: 83_333,
			insurance: 15_000,
		});
		expect(e?.lenderPayment).toBe(351_160);
		expect(amounts(e?.nonEscrow ?? [])).toEqual({ hoa: 10_000, other: 0 });
		expect(e?.nonEscrowTotal).toBe(10_000);
		expect(e?.total).toBe(361_160);
	});

	it("puts PMI in the lender payment group when it is on", () => {
		const e = estimateFor({
			...golden,
			downPaymentPercent: "10",
			pmiRate: "0.50",
		});
		expect(e?.lender.map((l) => l.id)).toEqual([
			"pi",
			"tax",
			"insurance",
			"pmi",
		]);
		expect(e?.nonEscrow.map((l) => l.id)).toEqual(["hoa", "other"]);
		expect(e?.lender.find((l) => l.id === "pmi")?.amount).toBe(18_750);
		expect(e?.lenderPayment).toBe(
			(e?.lender ?? []).reduce((t, l) => t + l.amount, 0),
		);
	});

	it("omits PMI when it is turned off or not required", () => {
		const off = estimateFor({
			...golden,
			downPaymentPercent: "10",
			pmiOn: false,
		});
		expect(off?.lender.some((l) => l.id === "pmi")).toBe(false);
		expect(estimateFor(golden)?.lender.some((l) => l.id === "pmi")).toBe(false);
	});

	it("is null while any part is invalid", () => {
		expect(estimateFor({ ...golden, homePrice: "" })).toBeNull();
		expect(estimateFor({ ...golden, monthlyHoa: "-1" })).toBeNull();
		expect(estimateFor({ ...golden, annualTaxOverride: "x" })).toBeNull();
		expect(
			estimateFor({ ...golden, downPaymentPercent: "10", pmiRate: "x" }),
		).toBeNull();
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

describe("line items always add up to the total (random inputs)", () => {
	it("holds over 2,000 seeded inputs, with and without PMI", () => {
		const random = makeRandom(20261031);
		const int = (min: number, max: number) =>
			min + Math.floor(random() * (max - min + 1));
		const money = (maxDollars: number) =>
			`${int(0, maxDollars)}.${String(int(0, 99)).padStart(2, "0")}`;
		const states = ["NY", "FL", "CA", "TX", "NJ"] as const;
		let withPmi = 0;
		let computed = 0;

		for (let n = 0; n < 2000; n++) {
			const e = estimateFor({
				...initialCalculatorState.inputs,
				homePrice: String(int(50_000, 2_000_000) + int(0, 99) / 100),
				downPaymentPercent: `${int(0, 60)}.${String(int(0, 99)).padStart(2, "0")}`,
				interestRate: `${int(0, 12)}.${String(int(0, 99)).padStart(2, "0")}`,
				termYears: ([15, 20, 30] as const)[int(0, 2)] ?? 30,
				state: states[int(0, 4)] ?? "NJ",
				annualTaxOverride: random() < 0.3 ? money(40_000) : "",
				annualInsurance: random() < 0.5 ? money(10_000) : "",
				extraAnnualInsurance: random() < 0.3 ? money(5_000) : "",
				monthlyHoa: random() < 0.5 ? money(1_500) : "",
				monthlyOther: random() < 0.3 ? money(500) : "",
				pmiOn: random() < 0.8,
				pmiRate: random() < 0.5 ? `0.${String(int(10, 99))}` : "",
			});
			if (!e) continue;
			computed++;
			if (e.lender.some((l) => l.id === "pmi")) withPmi++;
			const lender = e.lender.reduce((t, l) => t + l.amount, 0);
			const non = e.nonEscrow.reduce((t, l) => t + l.amount, 0);
			expect(e.lenderPayment).toBe(lender);
			expect(e.nonEscrowTotal).toBe(non);
			expect(e.total).toBe(lender + non);
			for (const line of [...e.lender, ...e.nonEscrow]) {
				expect(Number.isInteger(line.amount)).toBe(true);
				expect(line.amount).toBeGreaterThanOrEqual(0);
			}
		}
		// Make sure the property test really exercised the interesting paths.
		expect(computed).toBeGreaterThan(1900);
		expect(withPmi).toBeGreaterThan(200);
	});
});
