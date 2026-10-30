import type { Cents, Micros } from "@/types/units";

export const LOAN_TERMS = [15, 20, 30] as const;
export type LoanTerm = (typeof LOAN_TERMS)[number];

export type DownPaymentMode = "percent" | "amount";

/** Fields whose validation message is shown after the user leaves the field. */
export type ErrorField = "homePrice" | "downPayment" | "interestRate";

/** Raw text the user typed, plus which down payment form is the source. */
export interface CalculatorInputs {
	homePrice: string;
	downPaymentPercent: string;
	downPaymentAmount: string;
	downPaymentMode: DownPaymentMode;
	termYears: LoanTerm;
	interestRate: string;
}

export interface CalculatorState {
	inputs: CalculatorInputs;
	touched: Partial<Record<ErrorField, boolean>>;
}

export type EditableField =
	| "homePrice"
	| "downPaymentPercent"
	| "downPaymentAmount"
	| "interestRate";

export type CalculatorAction =
	| { type: "edit"; field: EditableField; value: string }
	| { type: "blur"; field: EditableField }
	| { type: "setDownPaymentMode"; mode: DownPaymentMode }
	| { type: "setTerm"; years: LoanTerm };

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
