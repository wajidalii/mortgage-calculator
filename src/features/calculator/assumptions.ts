import { DEFAULTS, isStale } from "@/config/defaults/defaults";
import { STATE_NAMES } from "@/config/defaults/stateTaxTable";
import type { Confidence, IsoDate } from "@/config/defaults/types";
import { formatMoney } from "@/lib/money";
import { formatPercent, formatRate, parseRate } from "@/lib/rate";
import type { Cents, Micros } from "@/types/units";
import type { Affordability } from "./affordability";
import { INDEX_PRESET_HINTS } from "./armSchedule";
import type { MonthlyCosts } from "./monthlyCosts";
import type { PmiResult } from "./pmi";
import type { PropertyTax } from "./propertyTax";
import type { CalculatorInputs, LoanDerivation } from "./types";

export type AssumptionStatus = "Entered" | "Illustrative" | "Overridden";

/**
 * One line of the assumptions list (PRD S-9). The same structure feeds the
 * panel and, later, the print report.
 */
export interface AssumptionItem {
	id: string;
	label: string;
	value: string;
	status: AssumptionStatus;
	/** Null for entered and overridden values: the date describes the default. */
	asOf: IsoDate | null;
	/** Null for entered and overridden values. */
	source: string | null;
	/** Null for entered and overridden values, and where it does not apply. */
	confidence: string | null;
	/** True only for an illustrative default past the stale limit. */
	stale: boolean;
}

const CONFIDENCE_TEXT: Record<Confidence, string | null> = {
	low: "Low",
	"low-to-moderate": "Low to moderate",
	moderate: "Moderate",
	"not-applicable": null,
};

interface DefaultRecordLike {
	asOf: IsoDate;
	source: string;
	confidence: Confidence;
}

const entered = (id: string, label: string, value: string): AssumptionItem => ({
	id,
	label,
	value,
	status: "Entered",
	asOf: null,
	source: null,
	confidence: null,
	stale: false,
});

/** A registry default in use, or the user's own value in its place. */
const fromDefault = (
	id: string,
	label: string,
	value: string,
	record: DefaultRecordLike,
	overridden: boolean,
	today: Date,
): AssumptionItem =>
	overridden
		? { ...entered(id, label, value), status: "Overridden" }
		: {
				id,
				label,
				value,
				status: "Illustrative",
				asOf: record.asOf,
				source: record.source,
				confidence: CONFIDENCE_TEXT[record.confidence],
				stale: isStale(record.asOf, today),
			};

const rateOr = (text: string, fallback: Micros): Micros => {
	const parsed = parseRate(text);
	return parsed.ok ? parsed.value : fallback;
};

export interface AssumptionsSource {
	inputs: CalculatorInputs;
	loan: LoanDerivation | null;
	tax: PropertyTax | null;
	costs: MonthlyCosts | null;
	pmi: PmiResult | null;
	affordability?: Affordability | null;
	/** Injectable so tests can fix the stale check. */
	today: Date;
}

const armItems = (inputs: CalculatorInputs, today: Date): AssumptionItem[] => {
	const terms = DEFAULTS.armTerms.value;
	const margin = rateOr(inputs.armMargin, terms.marginMicros);
	const initial = rateOr(inputs.armInitialCap, terms.initialCapMicros);
	const periodic = rateOr(inputs.armPeriodicCap, terms.periodicCapMicros);
	const lifetime = rateOr(inputs.armLifetimeCap, terms.lifetimeCapMicros);
	const floorBlank = inputs.armFloor.trim() === "";
	const floor = floorBlank ? margin : rateOr(inputs.armFloor, margin);
	const overridden =
		margin !== terms.marginMicros ||
		initial !== terms.initialCapMicros ||
		periodic !== terms.periodicCapMicros ||
		lifetime !== terms.lifetimeCapMicros ||
		!floorBlank;
	const preset = DEFAULTS.indexPathPresets.value.find(
		(item) => item.id === inputs.armIndexPreset,
	);
	return [
		fromDefault(
			"arm-terms",
			"ARM margin, floor and caps",
			`Margin ${formatPercent(margin, 2)}, floor ${formatPercent(floor, 2)}, caps ${formatPercent(initial, 2)} initial / ${formatPercent(periodic, 2)} periodic / ${formatPercent(lifetime, 2)} lifetime`,
			DEFAULTS.armTerms,
			overridden,
			today,
		),
		fromDefault(
			"arm-index",
			"ARM index path after month 60",
			`${preset?.label ?? inputs.armIndexPreset}. ${INDEX_PRESET_HINTS[inputs.armIndexPreset]}`,
			DEFAULTS.indexPathPresets,
			false,
			today,
		),
	];
};

/**
 * Every value the estimate rests on: what the user typed ("Entered"), the
 * registry defaults in use ("Illustrative") and defaults the user replaced
 * ("Overridden"). Parts that are not valid yet are left out, as the result is.
 */
export const buildAssumptions = ({
	inputs,
	loan,
	tax,
	costs,
	pmi,
	affordability,
	today,
}: AssumptionsSource): AssumptionItem[] => {
	const items: AssumptionItem[] = [];

	if (loan) {
		const isArm = inputs.loanType === "arm";
		items.push(
			entered("home-price", "Home price", formatMoney(loan.homePrice)),
			entered(
				"down-payment",
				"Down payment",
				`${formatMoney(loan.downPayment)} (${formatPercent(loan.downPaymentPercent, 2)})`,
			),
			entered(
				"interest-rate",
				isArm ? "Start rate" : "Interest rate",
				formatRate(loan.interestRate),
			),
			entered("term", "Loan term", `${loan.termYears} years`),
		);
	}

	if (tax) {
		items.push(
			tax.source === "manual"
				? fromDefault(
						"property-tax",
						"Property tax",
						`${formatMoney(tax.annual)} per year`,
						DEFAULTS.stateTaxRates,
						true,
						today,
					)
				: fromDefault(
						"property-tax",
						`Property tax rate (${STATE_NAMES[tax.state]})`,
						`${formatPercent(tax.rate, 2)} of the home price per year`,
						DEFAULTS.stateTaxRates,
						false,
						today,
					),
		);
	}

	if (costs) {
		const base = (costs.annualInsurance - costs.extraAnnualInsurance) as Cents;
		items.push(
			fromDefault(
				"insurance",
				"Homeowners insurance",
				`${formatMoney(base)} per year`,
				DEFAULTS.homeownersInsurance,
				!costs.insuranceIsDefault,
				today,
			),
		);
	}

	if (pmi?.status === "on") {
		items.push(
			fromDefault(
				"pmi-rate",
				"PMI rate",
				`${formatPercent(pmi.pmi.rate, 2)} per year`,
				DEFAULTS.pmiRate,
				!pmi.pmi.rateIsDefault,
				today,
			),
		);
	}

	if (loan && inputs.loanType === "arm") items.push(...armItems(inputs, today));

	if (affordability) {
		const { frontEnd, backEnd } = affordability;
		items.push(
			fromDefault(
				"dti-front-end",
				"Front-end limit (housing / income)",
				formatPercent(frontEnd.threshold, 1),
				DEFAULTS.dtiThresholds,
				!frontEnd.thresholdIsDefault,
				today,
			),
			fromDefault(
				"dti-back-end",
				"Back-end limit (housing + other debt / income)",
				formatPercent(backEnd.threshold, 1),
				DEFAULTS.dtiThresholds,
				!backEnd.thresholdIsDefault,
				today,
			),
		);
	}

	return items;
};

/** True when any default still in use is past the stale limit. */
export const hasStaleDefault = (items: readonly AssumptionItem[]): boolean =>
	items.some((item) => item.stale);
