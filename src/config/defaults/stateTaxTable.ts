import type { DefaultRecord, RateMicros } from "./types";

/**
 * Demo state property tax rates (PRD 9.1).
 *
 * This is the only module that knows about state-level tax rates. A later
 * ZIP-level data source replaces this file and nothing else.
 */

export type StateCode = "NY" | "FL" | "CA" | "TX" | "NJ";

/** Column label shown above the rates. The rates are not confirmed. */
export const STATE_TAX_COLUMN_LABEL = "Illustrative new-buyer estimate";

/** Annual rate on the home price, in millionths. 1.40% is 14000. */
export const STATE_TAX_TABLE: DefaultRecord<Record<StateCode, RateMicros>> = {
	value: {
		NY: 14000,
		FL: 9500,
		CA: 11000,
		TX: 16000,
		NJ: 20000,
	},
	source: "Product owner table. Not fully confirmed.",
	asOf: "2026-10-30",
	confidence: "low-to-moderate",
};
