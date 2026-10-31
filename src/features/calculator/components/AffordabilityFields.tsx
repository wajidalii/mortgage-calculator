import { DEFAULTS } from "@/config/defaults/defaults";
import { formatPercent } from "@/lib/rate";
import type { CalculatorInputs, EditableField, ErrorField } from "../types";
import TextField from "./TextField";

type DtiField = Extract<
	EditableField,
	"grossMonthlyIncome" | "otherMonthlyDebt" | "dtiFrontEnd" | "dtiBackEnd"
>;

interface AffordabilityFieldsProps {
	values: CalculatorInputs;
	errorFor: (field: ErrorField) => string | undefined;
	onChange: (field: DtiField, value: string) => void;
	onBlur: (field: DtiField) => void;
}

const thresholds = DEFAULTS.dtiThresholds.value;

const FIELDS: {
	field: DtiField;
	label: string;
	prefix?: string;
	suffix?: string;
	hint?: string;
}[] = [
	{ field: "grossMonthlyIncome", label: "Gross monthly income", prefix: "$" },
	{
		field: "otherMonthlyDebt",
		label: "Other monthly debt (optional)",
		prefix: "$",
		hint: "Car, student loan and card minimums.",
	},
	{
		field: "dtiFrontEnd",
		label: "Front-end limit",
		suffix: "%",
		hint: `Leave blank to use an illustrative ${formatPercent(thresholds.frontEndMicros, 1)}.`,
	},
	{
		field: "dtiBackEnd",
		label: "Back-end limit",
		suffix: "%",
		hint: `Leave blank to use an illustrative ${formatPercent(thresholds.backEndMicros, 1)}.`,
	},
];

const AffordabilityFields = ({
	values,
	errorFor,
	onChange,
	onBlur,
}: AffordabilityFieldsProps) => (
	<>
		{FIELDS.map(({ field, label, prefix, suffix, hint }) => (
			<TextField
				key={field}
				label={label}
				value={values[field]}
				error={errorFor(field)}
				{...(prefix ? { prefix } : {})}
				{...(suffix ? { suffix } : {})}
				{...(hint ? { hint } : {})}
				onChange={(value) => onChange(field, value)}
				onBlur={() => onBlur(field)}
			/>
		))}
	</>
);

export default AffordabilityFields;
