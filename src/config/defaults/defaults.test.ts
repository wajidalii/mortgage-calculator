import { describe, expect, it } from "vitest";
import { DEFAULTS, isStale, STALE_AFTER_DAYS } from "./defaults";
import { STATE_TAX_COLUMN_LABEL, STATE_TAX_TABLE } from "./stateTaxTable";

const daysBefore = (today: Date, days: number): string => {
	const d = new Date(today.getTime() - days * 86_400_000);
	return d.toISOString().slice(0, 10);
};

describe("isStale", () => {
	const today = new Date("2027-11-01T12:00:00Z");

	it("uses a 365 day limit", () => {
		expect(STALE_AFTER_DAYS).toBe(365);
	});

	it("is false at 364 and 365 days", () => {
		expect(isStale(daysBefore(today, 364), today)).toBe(false);
		expect(isStale(daysBefore(today, 365), today)).toBe(false);
	});

	it("is true at 366 days", () => {
		expect(isStale(daysBefore(today, 366), today)).toBe(true);
	});

	it("is false for a same-day date", () => {
		expect(isStale(daysBefore(today, 0), today)).toBe(false);
	});
});

describe("defaults registry", () => {
	it("gives every record a value, source, ISO asOf and confidence", () => {
		for (const record of Object.values(DEFAULTS)) {
			expect(record.value).toBeDefined();
			expect(record.source.length).toBeGreaterThan(0);
			expect(record.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(record.confidence.length).toBeGreaterThan(0);
		}
	});

	it("marks ARM and PMI as low confidence", () => {
		expect(DEFAULTS.armTerms.confidence).toBe("low");
		expect(DEFAULTS.pmiRate.confidence).toBe("low");
	});

	it("exports the tax table from its own module with the column label", () => {
		expect(DEFAULTS.stateTaxRates).toBe(STATE_TAX_TABLE);
		expect(STATE_TAX_COLUMN_LABEL).toBe("Illustrative new-buyer estimate");
	});

	// Guard (PRD 9.3): value and asOf must change together. If you change a
	// value, set a new asOf on the record and update this snapshot in the same
	// change. Editing only the value fails this test.
	it("matches the committed value and asOf snapshot", () => {
		const current = Object.fromEntries(
			Object.entries(DEFAULTS).map(([key, r]) => [
				key,
				{ value: r.value, asOf: r.asOf },
			]),
		);
		expect(current).toMatchInlineSnapshot(`
			{
			  "armTerms": {
			    "asOf": "2026-10-30",
			    "value": {
			      "initialCapMicros": 20000,
			      "lifetimeCapMicros": 50000,
			      "marginMicros": 27500,
			      "periodicCapMicros": 10000,
			    },
			  },
			  "dtiThresholds": {
			    "asOf": "2026-10-30",
			    "value": {
			      "backEndMicros": 360000,
			      "frontEndMicros": 280000,
			    },
			  },
			  "homeownersInsurance": {
			    "asOf": "2026-10-30",
			    "value": 240000,
			  },
			  "indexPathPresets": {
			    "asOf": "2026-10-30",
			    "value": [
			      {
			        "id": "flat",
			        "label": "Flat",
			      },
			      {
			        "id": "plus-one-per-year",
			        "label": "+1 point per year",
			      },
			      {
			        "id": "shock",
			        "label": "Shock",
			      },
			    ],
			  },
			  "pmiRate": {
			    "asOf": "2026-10-30",
			    "value": 7500,
			  },
			  "stateTaxRates": {
			    "asOf": "2026-10-30",
			    "value": {
			      "CA": 11000,
			      "FL": 9500,
			      "NJ": 20000,
			      "NY": 14000,
			      "TX": 16000,
			    },
			  },
			}
		`);
	});
});
