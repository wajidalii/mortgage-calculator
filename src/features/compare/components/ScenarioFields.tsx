import { useId } from "react";
import { DEFAULTS } from "@/config/defaults/defaults";
import LoanTypeSelector from "@/features/calculator/components/LoanTypeSelector";
import TermSelector from "@/features/calculator/components/TermSelector";
import TextField from "@/features/calculator/components/TextField";
import type { ScenarioInput } from "../compare";

interface ScenarioFieldsProps {
	title: string;
	scenario: ScenarioInput;
	rateError?: string | undefined;
	onChange: (patch: Partial<ScenarioInput>) => void;
	onRateBlur: () => void;
}

const ScenarioFields = ({
	title,
	scenario,
	rateError,
	onChange,
	onRateBlur,
}: ScenarioFieldsProps) => {
	const presetName = useId();
	const isArm = scenario.loanType === "arm";
	return (
		<fieldset className="grid content-start gap-4 rounded-md p-4 ring-1 ring-slate-300">
			<legend className="px-1 text-sm font-semibold text-slate-900">
				{title}
			</legend>
			<LoanTypeSelector
				value={scenario.loanType}
				onChange={(loanType) => onChange({ loanType })}
			/>
			<TermSelector
				value={scenario.termYears}
				onChange={(termYears) => onChange({ termYears })}
			/>
			<TextField
				label={isArm ? "Start rate" : "Interest rate"}
				suffix="%"
				value={scenario.interestRate}
				error={rateError}
				onChange={(interestRate) => onChange({ interestRate })}
				onBlur={onRateBlur}
			/>
			{isArm ? (
				<fieldset>
					<legend className="text-sm font-medium text-slate-800">
						Index path after month 60
					</legend>
					<div className="mt-1 grid gap-2">
						{DEFAULTS.indexPathPresets.value.map((item) => (
							<label key={item.id} className="flex items-center gap-2 text-sm">
								<input
									type="radio"
									name={presetName}
									value={item.id}
									checked={scenario.armIndexPreset === item.id}
									onChange={() => onChange({ armIndexPreset: item.id })}
									className="size-4 accent-brand-600"
								/>
								{item.label}
							</label>
						))}
					</div>
					<p className="mt-1 text-xs text-slate-500">
						ARM margin and caps use the illustrative defaults. The index path is
						an assumption, not a forecast.
					</p>
				</fieldset>
			) : null}
		</fieldset>
	);
};

export default ScenarioFields;
