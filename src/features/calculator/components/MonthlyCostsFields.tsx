import { DEFAULTS } from "@/config/defaults/defaults";
import { formatMoney } from "@/lib/money";
import type { CalculatorInputs, EditableField, ErrorField } from "../types";
import TextField from "./TextField";

type CostField = Extract<
	EditableField,
	"annualInsurance" | "extraAnnualInsurance" | "monthlyHoa" | "monthlyOther"
>;

interface MonthlyCostsFieldsProps {
	values: CalculatorInputs;
	errorFor: (field: ErrorField) => string | undefined;
	onChange: (field: CostField, value: string) => void;
	onBlur: (field: CostField) => void;
}

const FIELDS: { field: CostField; label: string; hint?: string }[] = [
	{
		field: "annualInsurance",
		label: "Annual homeowners insurance",
		hint: `Leave blank to use an illustrative ${formatMoney(DEFAULTS.homeownersInsurance.value)} per year.`,
	},
	{
		field: "extraAnnualInsurance",
		label: "Extra annual insurance (flood, wind)",
		hint: "Optional. No premium is added automatically.",
	},
	{ field: "monthlyHoa", label: "Monthly HOA" },
	{ field: "monthlyOther", label: "Other monthly cost (optional)" },
];

const MonthlyCostsFields = ({
	values,
	errorFor,
	onChange,
	onBlur,
}: MonthlyCostsFieldsProps) => (
	<>
		{FIELDS.map(({ field, label, hint }) => (
			<TextField
				key={field}
				label={label}
				prefix="$"
				value={values[field]}
				error={errorFor(field)}
				{...(hint ? { hint } : {})}
				onChange={(value) => onChange(field, value)}
				onBlur={() => onBlur(field)}
			/>
		))}
	</>
);

export default MonthlyCostsFields;
