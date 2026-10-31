import { DEFAULTS } from "@/config/defaults/defaults";
import {
	ARM_FIXED_MONTHS,
	type ArmParams,
	type ArmRow,
	armParamsFromTerms,
	buildArmSchedule,
	flatIndex,
	type IndexPath,
	MAX_ARM_POINTS,
	risingIndex,
	stepIndex,
} from "@/lib/arm";
import type { ParseError } from "@/lib/decimal";
import { formatPercent, parseRate } from "@/lib/rate";
import type { Cents, Micros } from "@/types/units";
import type {
	CalculatorInputs,
	ErrorField,
	IndexPresetId,
	LoanDerivation,
} from "./types";

/** Index (SOFR) level the presets start from: 3.75%, so 3.75% + 2.75% margin = 6.50%. */
export const ARM_INDEX_START = 37_500 as Micros;
/** The shock preset jumps to 9.00% at the first reset (PRD S-8). */
export const ARM_INDEX_SHOCK = 90_000 as Micros;
/** The rising preset adds 1 point for every full year after the first reset. */
export const ARM_INDEX_RISE_PER_YEAR = 10_000 as Micros;

const FIRST_RESET_MONTH = ARM_FIXED_MONTHS + 1;

/** Index path for a preset. These are assumptions, never forecasts. */
export const indexPathFor = (preset: IndexPresetId): IndexPath => {
	switch (preset) {
		case "flat":
			return flatIndex(ARM_INDEX_START);
		case "plus-one-per-year":
			return risingIndex(
				ARM_INDEX_START,
				ARM_INDEX_RISE_PER_YEAR,
				FIRST_RESET_MONTH,
			);
		case "shock":
			return stepIndex(ARM_INDEX_START, ARM_INDEX_SHOCK, FIRST_RESET_MONTH);
	}
};

/** One sentence per preset, shown with the selector and in the assumptions. */
export const INDEX_PRESET_HINTS: Record<IndexPresetId, string> = {
	flat: `The index stays at ${formatPercent(ARM_INDEX_START, 2)}.`,
	"plus-one-per-year": `The index starts at ${formatPercent(ARM_INDEX_START, 2)} and adds 1 point every year after month 60.`,
	shock: `The index jumps to ${formatPercent(ARM_INDEX_SHOCK, 2)} at month 61.`,
};

export type ArmErrorField = Extract<ErrorField, `arm${string}`>;
export type ArmErrors = Partial<Record<ArmErrorField, string>>;

/** What the result views need to flag the reset risk. */
export interface ArmSummary {
	presetLabel: string;
	/** Payment for months 1 to 60. */
	firstPayment: Cents;
	/** Highest scheduled payment over the loan, under the chosen index path. */
	peakPayment: Cents;
	/** First month the peak payment is in force. */
	peakMonth: number;
	/** Highest rate over the loan. */
	peakRate: Micros;
	/** True when the payment after month 60 goes above the first payment. */
	rises: boolean;
}

export interface ArmResult {
	rows: ArmRow[];
	summary: ArmSummary;
}

export interface ArmDerivation {
	errors: ArmErrors;
	/** Present only for a valid ARM on a valid loan. */
	result: ArmResult | null;
}

const NO_ARM: ArmDerivation = { errors: {}, result: null };

const parseMessage = (label: string, error: ParseError): string => {
	switch (error) {
		case "empty":
			return `Enter ${label.toLowerCase()}`;
		case "negative":
			return `${label} cannot be negative`;
		case "too-large":
			return `${label} is too large`;
		default:
			return `${label} must be a number`;
	}
};

/** Parses one percent field. Blank is an error unless `fallback` is given. */
const parsePoints = (
	text: string,
	label: string,
	errors: ArmErrors,
	field: ArmErrorField,
	fallback?: Micros,
): Micros | null => {
	if (fallback !== undefined && text.trim() === "") return fallback;
	const parsed = parseRate(text);
	if (!parsed.ok) {
		errors[field] = parseMessage(label, parsed.error);
		return null;
	}
	if (parsed.value > MAX_ARM_POINTS) {
		errors[field] = `${label} cannot be more than 100%`;
		return null;
	}
	return parsed.value;
};

/**
 * Validates the ARM inputs and, when `loan` is valid, builds the 5/6 ARM
 * schedule (PRD 8.5). Returns no result while any ARM input is invalid, so an
 * invalid cap never shows a payment. A fixed loan returns no ARM output.
 */
export const deriveArm = (
	inputs: CalculatorInputs,
	loan: LoanDerivation | null,
): ArmDerivation => {
	if (inputs.loanType !== "arm") return NO_ARM;

	const errors: ArmErrors = {};
	const margin = parsePoints(inputs.armMargin, "Margin", errors, "armMargin");
	const floor = parsePoints(
		inputs.armFloor,
		"Floor",
		errors,
		"armFloor",
		margin ?? DEFAULTS.armTerms.value.marginMicros,
	);
	const initialCap = parsePoints(
		inputs.armInitialCap,
		"Initial cap",
		errors,
		"armInitialCap",
	);
	const periodicCap = parsePoints(
		inputs.armPeriodicCap,
		"Periodic cap",
		errors,
		"armPeriodicCap",
	);
	const lifetimeCap = parsePoints(
		inputs.armLifetimeCap,
		"Lifetime cap",
		errors,
		"armLifetimeCap",
	);

	if (
		Object.keys(errors).length > 0 ||
		margin === null ||
		floor === null ||
		initialCap === null ||
		periodicCap === null ||
		lifetimeCap === null ||
		loan === null
	) {
		return { errors, result: null };
	}

	const params: ArmParams = armParamsFromTerms(DEFAULTS.armTerms.value, {
		margin,
		floor,
		initialCap,
		periodicCap,
		lifetimeCap,
	});
	const rows = buildArmSchedule({
		loan: loan.loanAmount,
		startRate: loan.interestRate,
		payments: loan.termYears * 12,
		params,
		indexPath: indexPathFor(inputs.armIndexPreset),
	});

	let peak: ArmRow | undefined;
	let peakRate: Micros = loan.interestRate;
	for (const row of rows) {
		if (!peak || row.scheduledPayment > peak.scheduledPayment) peak = row;
		if (row.rate > peakRate) peakRate = row.rate;
	}
	const preset = DEFAULTS.indexPathPresets.value.find(
		(item) => item.id === inputs.armIndexPreset,
	);
	const firstPayment = loan.monthlyPrincipalAndInterest;
	const peakPayment = peak?.scheduledPayment ?? firstPayment;
	return {
		errors,
		result: {
			rows,
			summary: {
				presetLabel: preset?.label ?? inputs.armIndexPreset,
				firstPayment,
				peakPayment,
				peakMonth: peak?.month ?? 1,
				peakRate,
				rises: peakPayment > firstPayment,
			},
		},
	};
};
