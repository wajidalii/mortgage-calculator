import { useId } from "react";
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
		<fieldset className="grid grid-cols-1 gap-5 @md:col-span-2 @md:grid-cols-2">
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
			<fieldset className="@md:col-span-2">
				<legend className="text-sm font-medium text-slate-800">
					Index path after month 60
				</legend>
				<div className="mt-1 grid grid-cols-1 gap-2 @md:grid-cols-3">
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
							<span className="flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 peer-checked:bg-brand-600 peer-checked:text-white peer-checked:ring-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500">
								{item.label}
							</span>
						</label>
					))}
				</div>
				<p className="mt-1 text-xs text-slate-500">
					{INDEX_PRESET_HINTS[preset]} This is an assumption, not a forecast.
				</p>
			</fieldset>
		</fieldset>
	);
};

export default ArmFields;
