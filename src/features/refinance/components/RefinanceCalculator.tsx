import { useDeferredValue, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import TextField from "@/features/calculator/components/TextField";
import {
	deriveRefinance,
	initialRefinanceInputs,
	type RefinanceField,
} from "../refinance";
import RefinanceResult from "./RefinanceResult";

const FIELDS: {
	field: RefinanceField;
	label: string;
	prefix?: string;
	suffix?: string;
	hint?: string;
}[] = [
	{ field: "balance", label: "Current loan balance", prefix: "$" },
	{
		field: "remainingMonths",
		label: "Remaining months",
		hint: "The new loan uses this same term.",
	},
	{ field: "currentRate", label: "Current interest rate", suffix: "%" },
	{ field: "newRate", label: "New interest rate", suffix: "%" },
	{
		field: "costs",
		label: "Refinance costs (optional)",
		prefix: "$",
		hint: "Blank counts as $0.",
	},
];

const RefinanceCalculator = () => {
	const [inputs, setInputs] = useState(initialRefinanceInputs);
	const [touched, setTouched] = useState<
		Partial<Record<RefinanceField, boolean>>
	>({});
	const deferred = useDeferredValue(inputs);
	const derived = useMemo(() => deriveRefinance(deferred), [deferred]);
	const showsErrors = FIELDS.some(
		({ field }) => touched[field] && derived.errors[field] !== undefined,
	);

	return (
		<div className="grid gap-6">
			<Card>
				<form
					noValidate
					onSubmit={(event) => event.preventDefault()}
					className="grid gap-5 sm:grid-cols-2"
				>
					{FIELDS.map(({ field, label, prefix, suffix, hint }) => (
						<TextField
							key={field}
							label={label}
							value={inputs[field]}
							error={touched[field] ? derived.errors[field] : undefined}
							{...(prefix ? { prefix } : {})}
							{...(suffix ? { suffix } : {})}
							{...(hint ? { hint } : {})}
							onChange={(value) =>
								setInputs((prev) => ({ ...prev, [field]: value }))
							}
							onBlur={() => setTouched((prev) => ({ ...prev, [field]: true }))}
						/>
					))}
				</form>
			</Card>
			<RefinanceResult result={derived.result} showsErrors={showsErrors} />
		</div>
	);
};

export default RefinanceCalculator;
