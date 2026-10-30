import { describe, expect, it } from "vitest";
import { buildSchedule } from "@/lib/amortization";
import { buildAssumptions, hasStaleDefault } from "./assumptions";
import { initialCalculatorState } from "./calculatorReducer";
import { deriveLoan } from "./loanMath";
import { deriveMonthlyCosts } from "./monthlyCosts";
import { derivePmi } from "./pmi";
import { derivePropertyTax } from "./propertyTax";
import type { CalculatorInputs } from "./types";

const FRESH = new Date("2027-01-15T12:00:00Z");
const STALE = new Date("2027-11-01T12:00:00Z");

const build = (overrides: Partial<CalculatorInputs> = {}, today = FRESH) => {
	const inputs = {
		...initialCalculatorState.inputs,
		downPaymentPercent: "10.00",
		downPaymentAmount: "50,000.00",
		...overrides,
	};
	const { loan } = deriveLoan(inputs);
	const schedule = loan
		? buildSchedule({
				loan: loan.loanAmount,
				rate: loan.interestRate,
				payments: loan.termYears * 12,
			})
		: null;
	return buildAssumptions({
		inputs,
		loan,
		tax: derivePropertyTax(inputs).tax,
		costs: deriveMonthlyCosts(inputs).costs,
		pmi: derivePmi(inputs, loan, schedule).result,
		today,
	});
};

const find = (items: ReturnType<typeof build>, id: string) =>
	items.find((item) => item.id === id);

describe("buildAssumptions", () => {
	it("lists each default with status, as-of date and source", () => {
		const items = build();
		const insurance = find(items, "insurance");
		expect(insurance).toMatchObject({
			label: "Homeowners insurance",
			value: "$2,400.00 per year",
			status: "Illustrative",
			asOf: "2026-10-30",
			stale: false,
		});
		expect(insurance?.source).toContain("public 2026 estimates");
		expect(find(items, "property-tax")).toMatchObject({
			label: "Property tax rate (New Jersey)",
			value: "2.00% of the home price per year",
			status: "Illustrative",
		});
		expect(find(items, "pmi-rate")).toMatchObject({
			value: "0.75% per year",
			status: "Illustrative",
			confidence: "Low",
		});
	});

	it("lists what the user typed as Entered, with no date or source", () => {
		const price = find(build(), "home-price");
		expect(price).toMatchObject({
			value: "$500,000.00",
			status: "Entered",
			asOf: null,
			source: null,
		});
	});

	it("marks an overridden default and hides its date and source", () => {
		const items = build({
			annualInsurance: "3000",
			annualTaxOverride: "9000",
			pmiRate: "1",
		});
		for (const id of ["insurance", "property-tax", "pmi-rate"]) {
			expect(find(items, id)).toMatchObject({
				status: "Overridden",
				asOf: null,
				source: null,
				confidence: null,
				stale: false,
			});
		}
		expect(find(items, "insurance")?.value).toBe("$3,000.00 per year");
	});

	it("leaves PMI out when it is not required", () => {
		expect(
			find(
				build({ downPaymentPercent: "20.00", downPaymentAmount: "100,000.00" }),
				"pmi-rate",
			),
		).toBeUndefined();
	});

	it("is fresh at 365 days and stale a day later", () => {
		const fresh = build({}, new Date("2027-10-30T00:00:00Z"));
		const stale = build({}, new Date("2027-10-31T00:00:00Z"));
		expect(hasStaleDefault(fresh)).toBe(false);
		expect(hasStaleDefault(stale)).toBe(true);
	});

	it("flags only the illustrative defaults as stale", () => {
		const items = build({ annualInsurance: "3000" }, STALE);
		expect(find(items, "insurance")?.stale).toBe(false);
		expect(find(items, "property-tax")?.stale).toBe(true);
		expect(find(items, "home-price")?.stale).toBe(false);
	});

	it("lists the ARM terms and index path, and overrides on a changed cap", () => {
		const base = build({ loanType: "arm" });
		expect(find(base, "arm-terms")).toMatchObject({
			status: "Illustrative",
			value:
				"Margin 2.75%, floor 2.75%, caps 2.00% initial / 1.00% periodic / 5.00% lifetime",
		});
		expect(find(base, "arm-index")?.value).toContain("Flat");
		expect(find(base, "interest-rate")?.label).toBe("Start rate");
		const changed = build({ loanType: "arm", armInitialCap: "3" });
		expect(find(changed, "arm-terms")?.status).toBe("Overridden");
		expect(find(build(), "arm-terms")).toBeUndefined();
	});

	it("returns nothing while the loan is invalid", () => {
		const items = build({ homePrice: "" });
		expect(find(items, "home-price")).toBeUndefined();
		expect(find(items, "interest-rate")).toBeUndefined();
	});
});
