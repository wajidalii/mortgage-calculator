import type { StateCode } from "@/config/defaults/stateTaxTable";
import type { Cents, Micros } from "@/types/units";

export const LOAN_TERMS = [15, 20, 30] as const;
export type LoanTerm = (typeof LOAN_TERMS)[number];

export type DownPaymentMode = "percent" | "amount";

/** Fields whose validation message is shown after the user leaves the field. */
export type ErrorField =
	| "homePrice"
	| "downPayment"
	| "interestRate"
	| "annualTaxOverride"
	| "annualInsurance"
	| "extraAnnualInsurance"
	| "monthlyHoa"
	| "monthlyOther"
	| "pmiRate";

/** Raw text the user typed, plus which down payment form is the source. */
export interface CalculatorInputs {
	homePrice: string;
	downPaymentPercent: string;
	downPaymentAmount: string;
	downPaymentMode: DownPaymentMode;
	termYears: LoanTerm;
	interestRate: string;
	state: StateCode;
	/** Annual property tax typed by the user. Empty means use the state rate. */
	annualTaxOverride: string;
	/** Empty means use the national default. */
	annualInsurance: string;
	/** Optional extra annual premium (flood, wind). Empty means none. */
	extraAnnualInsurance: string;
	monthlyHoa: string;
	/** One optional monthly amount, not a list. */
	monthlyOther: string;
	/** PMI toggle. Only matters when LTV is above 80%. */
	pmiOn: boolean;
	/** Annual PMI rate in percent. Empty means use the default. */
	pmiRate: string;
}

export interface CalculatorState {
	inputs: CalculatorInputs;
	touched: Partial<Record<ErrorField, boolean>>;
}

export type EditableField =
	| "homePrice"
	| "downPaymentPercent"
	| "downPaymentAmount"
	| "interestRate"
	| "annualTaxOverride"
	| "annualInsurance"
	| "extraAnnualInsurance"
	| "monthlyHoa"
	| "monthlyOther"
	| "pmiRate";

export type CalculatorAction =
	| { type: "edit"; field: EditableField; value: string }
	| { type: "blur"; field: EditableField }
	| { type: "setDownPaymentMode"; mode: DownPaymentMode }
	| { type: "setTerm"; years: LoanTerm }
	| { type: "setState"; state: StateCode }
	| { type: "setPmiOn"; on: boolean };

export interface LoanDerivation {
	homePrice: Cents;
	downPayment: Cents;
	downPaymentPercent: Micros;
	loanAmount: Cents;
	/** Monthly principal and interest for the fixed-rate loan. */
	monthlyPrincipalAndInterest: Cents;
	/** loan / price, in millionths. 80.00% is 800000. */
	ltv: Micros;
	interestRate: Micros;
	termYears: LoanTerm;
}

export type InputErrors = Partial<Record<ErrorField, string>>;

export interface DerivedLoan {
	errors: InputErrors;
	/** Present only when every input is valid. */
	loan: LoanDerivation | null;
}
