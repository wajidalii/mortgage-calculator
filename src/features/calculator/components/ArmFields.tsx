import { useId } from "react";
import { SEGMENT_GROUP, SEGMENT_OPTION } from "@/components/ui/segmented";
import { DEFAULTS } from "@/config/defaults/defaults";
import { INDEX_PRESET_HINTS } from "../armSchedule";
import type { EditableField, ErrorField, IndexPresetId } from "../types";
import TextField from "./TextField";

type ArmField = Extract<EditableField, `arm${string}`>;

interface ArmFieldsProps {
	margin: string;
	floor: string;
	initialCap: string;
	periodicCap: string;
	lifetimeCap: string;
	preset: IndexPresetId;
	errorFor: (field: ErrorField) => string | undefined;
	onChange: (field: ArmField, value: string) => void;
	onBlur: (field: ArmField) => void;
	onPresetChange: (preset: IndexPresetId) => void;
}

const ArmFields = ({
	margin,
	floor,
	initialCap,
	periodicCap,
	lifetimeCap,
	preset,
	errorFor,
	onChange,
	onBlur,
	onPresetChange,
}: ArmFieldsProps) => {
	const name = useId();
	const field = (
		key: ArmField,
		label: string,
		value: string,
		hint?: string,
	) => (
		<TextField
			label={label}
			suffix="%"
			value={value}
			error={errorFor(key)}
			{...(hint ? { hint } : {})}
			onChange={(next) => onChange(key, next)}
			onBlur={() => onBlur(key)}
		/>
	);

	return (
		<fieldset className="grid gap-5 sm:col-span-2 sm:grid-cols-2">
			<legend className="text-sm font-semibold text-slate-900">
				5/6 ARM terms
			</legend>
			{field("armMargin", "Margin", margin)}
			{field("armFloor", "Rate floor", floor, "Leave blank to use the margin.")}
			{field(
				"armInitialCap",
				"Initial cap",
				initialCap,
				"First reset, in points.",
			)}
			{field(
				"armPeriodicCap",
				"Periodic cap",
				periodicCap,
				"Each later reset, in points.",
			)}
			{field(
				"armLifetimeCap",
				"Lifetime cap",
				lifetimeCap,
				"Above the start rate, in points.",
			)}
			<fieldset className="sm:col-span-2">
				<legend className="text-sm font-semibold text-slate-800">
					Index path after month 60
				</legend>
				<div className={`${SEGMENT_GROUP} sm:grid-cols-3`}>
					{DEFAULTS.indexPathPresets.value.map((item) => (
						<label key={item.id} className="relative">
							<input
								type="radio"
								name={name}
								value={item.id}
								checked={preset === item.id}
								onChange={() => onPresetChange(item.id)}
								className="peer sr-only"
							/>
							<span className={SEGMENT_OPTION}>{item.label}</span>
						</label>
					))}
				</div>
				<p className="mt-1.5 text-xs leading-relaxed text-slate-600">
					{INDEX_PRESET_HINTS[preset]} This is an assumption, not a forecast.
				</p>
			</fieldset>
		</fieldset>
	);
};

export default ArmFields;
