import { STATE_TAX_TABLE } from "./stateTaxTable";
import type { DefaultRecord, IsoDate, MoneyCents, RateMicros } from "./types";

/**
 * Registry of every illustrative default (PRD 9.2 and 9.3).
 * Money is integer cents, rates are integer millionths.
 * Changing a value requires a new `asOf` in the same change; the guard test
 * in defaults.test.ts fails otherwise.
 */

/** A default older than this many days is shown as "May be out of date". */
export const STALE_AFTER_DAYS = 365;

const MS_PER_DAY = 86_400_000;

const toUtcDay = (iso: IsoDate): number => {
	const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = iso
		.split("-")
		.map(Number);
	return Date.UTC(year, month - 1, day);
};

/**
 * True when `asOf` is more than STALE_AFTER_DAYS before `today`.
 * Exactly 365 days is not stale. Staleness never blocks a calculation.
 */
export const isStale = (asOf: IsoDate, today: Date = new Date()): boolean => {
	const todayUtc = Date.UTC(
		today.getUTCFullYear(),
		today.getUTCMonth(),
		today.getUTCDate(),
	);
	return (todayUtc - toUtcDay(asOf)) / MS_PER_DAY > STALE_AFTER_DAYS;
};

export interface IndexPreset {
	id: "flat" | "plus-one-per-year" | "shock";
	label: string;
}

const AS_OF = "2026-10-30";

export const DEFAULTS = {
	stateTaxRates: STATE_TAX_TABLE,
	homeownersInsurance: {
		/** Annual, flat. Does not scale with home price. $2,400.00 per year. */
		value: 240000 as MoneyCents,
		source:
			"Four public 2026 estimates between $2,377 and $2,543, based on about $300,000 of dwelling coverage",
		asOf: AS_OF,
		confidence: "moderate",
	},
	pmiRate: {
		/** Annual rate on the loan amount. 0.75% per year. */
		value: 7500 as RateMicros,
		source:
			"Midpoint of the commonly cited 0.5% to 1.0% range. No authoritative rate matrix was found.",
		asOf: AS_OF,
		confidence: "low",
	},
	armTerms: {
		value: {
			/** 2.75% margin. */
			marginMicros: 27500 as RateMicros,
			/** Caps 2/1/5 in rate points: initial 2%, periodic 1%, lifetime 5%. */
			initialCapMicros: 20000 as RateMicros,
			periodicCapMicros: 10000 as RateMicros,
			lifetimeCapMicros: 50000 as RateMicros,
		},
		source:
			"Author's knowledge of typical 5/6 SOFR terms. Not checked against a Loan Estimate.",
		asOf: AS_OF,
		confidence: "low",
	},
	dtiThresholds: {
		value: {
			/** 28% front-end. */
			frontEndMicros: 280000 as RateMicros,
			/** 36% back-end. */
			backEndMicros: 360000 as RateMicros,
		},
		source: "Common industry rules of thumb. Not verified.",
		asOf: AS_OF,
		confidence: "moderate",
	},
	indexPathPresets: {
		value: [
			{ id: "flat", label: "Flat" },
			{ id: "plus-one-per-year", label: "+1 point per year" },
			{ id: "shock", label: "Shock" },
		] as IndexPreset[],
		source: "Product choice",
		asOf: AS_OF,
		confidence: "not-applicable",
	},
} satisfies Record<string, DefaultRecord<unknown>>;
