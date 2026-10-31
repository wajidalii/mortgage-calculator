import { monthlyPayment } from "@/lib/payment";
import type { Cents, Micros } from "@/types/units";

/**
 * The sample loan behind the hero preview. Principal and interest comes from
 * the app's own payment function; tax and insurance are fixed illustrative
 * amounts, and the page labels the whole card as an example.
 */
const PRICE = 50_000_000 as Cents; // $500,000
const DOWN_PERCENT = 20;
const RATE = 65_000 as Micros; // 6.5%
const TERM_MONTHS = 360;
const SAMPLE_MONTHLY_TAX = 79_167 as Cents; // $791.67
const SAMPLE_MONTHLY_INSURANCE = 15_000 as Cents; // $150.00

export interface PreviewLine {
	id: "pi" | "tax" | "insurance";
	label: string;
	amount: Cents;
	/** Whole-percent share of the monthly total, for display only. */
	percent: number;
}

export interface HomePreview {
	price: Cents;
	downPercent: number;
	loan: Cents;
	rate: Micros;
	termYears: number;
	total: Cents;
	lines: PreviewLine[];
	/** About: the last payment of a real schedule differs by a few cents. */
	lifetimeInterest: Cents;
	/** Remaining balance as a 0 to 1 fraction at evenly spaced months. */
	balanceCurve: number[];
}

/** Balance fraction left after `month` payments. Drawing only, never money. */
const balanceFraction = (monthlyRate: number, month: number): number => {
	if (monthlyRate === 0) return 1 - month / TERM_MONTHS;
	const growth = (1 + monthlyRate) ** TERM_MONTHS;
	return (growth - (1 + monthlyRate) ** month) / (growth - 1);
};

export const buildHomePreview = (): HomePreview => {
	const down = Math.round((PRICE * DOWN_PERCENT) / 100) as Cents;
	const loan = (PRICE - down) as Cents;
	const pi = monthlyPayment(loan, RATE, TERM_MONTHS);
	const total = (pi + SAMPLE_MONTHLY_TAX + SAMPLE_MONTHLY_INSURANCE) as Cents;
	const share = (amount: number) => Math.round((amount * 100) / total);
	const monthlyRate = RATE / 12_000_000;
	const points = 12;

	return {
		price: PRICE,
		downPercent: DOWN_PERCENT,
		loan,
		rate: RATE,
		termYears: TERM_MONTHS / 12,
		total,
		lines: [
			{
				id: "pi",
				label: "Principal and interest",
				amount: pi,
				percent: share(pi),
			},
			{
				id: "tax",
				label: "Property tax",
				amount: SAMPLE_MONTHLY_TAX,
				percent: share(SAMPLE_MONTHLY_TAX),
			},
			{
				id: "insurance",
				label: "Homeowners insurance",
				amount: SAMPLE_MONTHLY_INSURANCE,
				percent: share(SAMPLE_MONTHLY_INSURANCE),
			},
		],
		lifetimeInterest: (pi * TERM_MONTHS - loan) as Cents,
		balanceCurve: Array.from({ length: points + 1 }, (_, index) =>
			balanceFraction(monthlyRate, Math.round((index * TERM_MONTHS) / points)),
		),
	};
};
