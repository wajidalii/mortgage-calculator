import { useId } from "react";
import { DEFAULTS } from "@/config/defaults/defaults";
import TextField from "@/features/calculator/components/TextField";
import type { ScenarioInput } from "../compare";

interface RateCellProps {
	scenario: ScenarioInput;
	rateError?: string | undefined;
	onChange: (patch: Partial<ScenarioInput>) => void;
	onRateBlur: () => void;
}

const RateCell = ({
	scenario,
	rateError,
	onChange,
	onRateBlur,
}: RateCellProps) => {
	const presetName = useId();
	const isArm = scenario.loanType === "arm";
	return (
		<div className="grid content-start gap-4">
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
					<legend className="text-sm font-semibold text-slate-800">
						Index path after month 60
					</legend>
					<div className="mt-1 grid gap-1">
						{DEFAULTS.indexPathPresets.value.map((item) => (
							<label
								key={item.id}
								className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm motion-safe:transition-colors motion-safe:duration-micro hover:bg-slate-50"
							>
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
					<p className="mt-1 text-xs text-slate-600">
						Margin and caps use the illustrative defaults. The index path is an
						assumption, not a forecast.
					</p>
				</fieldset>
			) : (
				<p className="text-xs text-slate-600">
					Fixed for the whole term. No rate reset.
				</p>
			)}
		</div>
	);
};

export default RateCell;
