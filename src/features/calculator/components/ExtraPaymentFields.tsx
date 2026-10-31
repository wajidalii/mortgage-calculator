import type { CalculatorInputs, EditableField, ErrorField } from "../types";
import TextField from "./TextField";

type ExtraField = Extract<
	EditableField,
	"extraMonthly" | "lumpSum" | "lumpMonth"
>;

interface ExtraPaymentFieldsProps {
	values: CalculatorInputs;
	errorFor: (field: ErrorField) => string | undefined;
	onChange: (field: ExtraField, value: string) => void;
	onBlur: (field: ExtraField) => void;
}

const ExtraPaymentFields = ({
	values,
	errorFor,
	onChange,
	onBlur,
}: ExtraPaymentFieldsProps) => {
	if (values.loanType === "arm") {
		return (
			<p className="text-sm text-slate-700 sm:col-span-2">
				Extra payments are available for fixed-rate loans only.
			</p>
		);
	}
	const props = (field: ExtraField) => ({
		value: values[field],
		error: errorFor(field),
		onChange: (value: string) => onChange(field, value),
		onBlur: () => onBlur(field),
	});
	return (
		<>
			<TextField
				label="Extra payment each month (optional)"
				prefix="$"
				hint="Paid toward principal from month 1."
				{...props("extraMonthly")}
			/>
			<TextField
				label="One-time lump sum (optional)"
				prefix="$"
				{...props("lumpSum")}
			/>
			<TextField
				label="Lump sum month"
				hint="Payment number, for example 60 for the end of year 5."
				{...props("lumpMonth")}
			/>
		</>
	);
};

export default ExtraPaymentFields;
