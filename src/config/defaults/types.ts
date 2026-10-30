/** Integer cents. $2,400.00 is 240000. Local alias until the branded Cents type from the money primitives lands. */
export type MoneyCents = number;

/** Integer millionths. 1.40% is 14000 (1,000,000 is 100%). Local alias until the branded Micros type lands. */
export type RateMicros = number;

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
