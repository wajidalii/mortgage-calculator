import { TOGGLE_GROUP, toggleOption } from "@/components/ui/segmented";
import { formatMoney } from "@/lib/money";
import type { Cents } from "@/types/units";
import {
	type CalculatorInputs,
	CLOSING_LINES,
	type ClosingLineId,
	type ClosingMode,
	type ErrorField,
} from "../types";
import TextField from "./TextField";

interface ClosingCostsFieldsProps {
	closing: CalculatorInputs["closing"];
	credits: string;
	/** Dollar value of each valid line, shown next to a percent field. */
	dollars: Partial<Record<ClosingLineId, Cents>>;
	errorFor: (field: ErrorField) => string | undefined;
	onValueChange: (line: ClosingLineId, value: string) => void;
	onModeChange: (line: ClosingLineId, mode: ClosingMode) => void;
	onBlur: (line: ClosingLineId) => void;
	onCreditsChange: (value: string) => void;
	onCreditsBlur: () => void;
}

const MODES: { mode: ClosingMode; label: string }[] = [
	{ mode: "amount", label: "$" },
	{ mode: "percent", label: "% of price" },
];

const ClosingCostsFields = ({
	closing,
	credits,
	dollars,
	errorFor,
	onValueChange,
	onModeChange,
	onBlur,
	onCreditsChange,
	onCreditsBlur,
}: ClosingCostsFieldsProps) => (
	<fieldset className="grid gap-5 sm:col-span-2 sm:grid-cols-2">
		<legend className="sr-only">Closing costs (optional)</legend>
		{CLOSING_LINES.map((item) => {
			const line = closing[item.id];
			const dollar = dollars[item.id];
			const percentHint =
				line.mode === "percent" &&
				line.value.trim() !== "" &&
				dollar !== undefined
					? `= ${formatMoney(dollar)}`
					: undefined;
			const hint = percentHint ?? ("hint" in item ? item.hint : undefined);
			return (
				<div key={item.id} className="grid gap-1">
					<TextField
						label={item.label}
						{...(line.mode === "amount" ? { prefix: "$" } : { suffix: "%" })}
						value={line.value}
						error={errorFor(`closing:${item.id}`)}
						{...(hint ? { hint } : {})}
						onChange={(value) => onValueChange(item.id, value)}
						onBlur={() => onBlur(item.id)}
					/>
					<fieldset className={`${TOGGLE_GROUP} justify-self-start`}>
						<legend className="sr-only">{item.label} entered as</legend>
						{MODES.map((option) => (
							<button
								key={option.mode}
								type="button"
								aria-pressed={line.mode === option.mode}
								aria-label={`${item.label} as ${option.mode === "amount" ? "dollars" : "percent of price"}`}
								onClick={() => onModeChange(item.id, option.mode)}
								className={toggleOption(line.mode === option.mode)}
							>
								{option.label}
							</button>
						))}
					</fieldset>
				</div>
			);
		})}
		<TextField
			label="Credits (seller or lender)"
			prefix="$"
			value={credits}
			error={errorFor("closingCredits")}
			hint="Optional. Subtracted from the cash to close."
			onChange={onCreditsChange}
			onBlur={onCreditsBlur}
		/>
	</fieldset>
);

export default ClosingCostsFields;
