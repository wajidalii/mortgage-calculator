export type Confidence =
	| "low"
	| "low-to-moderate"
	| "moderate"
	| "not-applicable";

/** ISO calendar date, YYYY-MM-DD. */
export type IsoDate = string;

/** PRD 9.3: every default is stored with its source, as-of date and confidence. */
export interface DefaultRecord<T> {
	value: T;
	source: string;
	asOf: IsoDate;
	confidence: Confidence;
}
