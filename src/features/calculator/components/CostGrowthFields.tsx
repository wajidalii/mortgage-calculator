import type { CalculatorInputs, EditableField, ErrorField } from "../types";
import TextField from "./TextField";

type GrowthField = Extract<EditableField, "taxGrowth" | "insuranceGrowth">;

interface CostGrowthFieldsProps {
	values: CalculatorInputs;
	errorFor: (field: ErrorField) => string | undefined;
	onChange: (field: GrowthField, value: string) => void;
	onBlur: (field: GrowthField) => void;
}

const FIELDS: { field: GrowthField; label: string }[] = [
	{ field: "taxGrowth", label: "Property tax growth per year (optional)" },
	{ field: "insuranceGrowth", label: "Insurance growth per year (optional)" },
];

const CostGrowthFields = ({
	values,
	errorFor,
	onChange,
	onBlur,
}: CostGrowthFieldsProps) => (
	<>
		{FIELDS.map(({ field, label }) => (
			<TextField
				key={field}
				label={label}
				suffix="%"
				hint="Blank means 0%."
				value={values[field]}
				error={errorFor(field)}
				onChange={(value) => onChange(field, value)}
				onBlur={() => onBlur(field)}
			/>
		))}
	</>
);

export default CostGrowthFields;
