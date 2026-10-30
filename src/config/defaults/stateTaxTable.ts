import type { Micros } from "../../types/units";
import type { DefaultRecord } from "./types";

/**
 * Demo state property tax rates (PRD 9.1).
 *
 * This is the only module that knows about state-level tax rates. A later
 * ZIP-level data source replaces this file and nothing else.
 */

export type StateCode = "NY" | "FL" | "CA" | "TX" | "NJ";

/** Display names for the states in the table. */
export const STATE_NAMES: Record<StateCode, string> = {
	NY: "New York",
	FL: "Florida",
	CA: "California",
	TX: "Texas",
	NJ: "New Jersey",
};

/** Column label shown above the rates. The rates are not confirmed. */
export const STATE_TAX_COLUMN_LABEL = "Illustrative new-buyer estimate";

/** Annual rate on the home price, in millionths. 1.40% is 14000. */
export const STATE_TAX_TABLE: DefaultRecord<Record<StateCode, Micros>> = {
	value: {
		NY: 14000 as Micros,
		FL: 9500 as Micros,
		CA: 11000 as Micros,
		TX: 16000 as Micros,
		NJ: 20000 as Micros,
	},
	source: "Product owner table. Not fully confirmed.",
	asOf: "2026-10-30",
	confidence: "low-to-moderate",
};
