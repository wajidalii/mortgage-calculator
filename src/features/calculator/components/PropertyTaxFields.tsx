import { useId } from "react";
import { DEFAULTS } from "@/config/defaults/defaults";
import { STATE_NAMES, type StateCode } from "@/config/defaults/stateTaxTable";
import { formatPercent } from "@/lib/rate";
import TextField from "./TextField";

interface PropertyTaxFieldsProps {
	state: StateCode;
	override: string;
	error?: string | undefined;
	onStateChange: (state: StateCode) => void;
	onOverrideChange: (value: string) => void;
	onBlur: () => void;
}

const STATES = Object.keys(STATE_NAMES) as StateCode[];

const PropertyTaxFields = ({
	state,
	override,
	error,
	onStateChange,
	onOverrideChange,
	onBlur,
}: PropertyTaxFieldsProps) => {
	const id = useId();
	return (
		<>
			<div>
				<label
					htmlFor={id}
					className="block text-sm font-semibold text-slate-800"
				>
					State
				</label>
				<select
					id={id}
					value={state}
					onChange={(event) => onStateChange(event.target.value as StateCode)}
					className="mt-1.5 min-h-12 w-full rounded-xl bg-white px-3 py-2 text-base font-semibold text-slate-900 ring-1 ring-slate-300 hover:ring-slate-400 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
				>
					{STATES.map((code) => (
						<option key={code} value={code}>
							{STATE_NAMES[code]} ({code}) ·{" "}
							{formatPercent(DEFAULTS.stateTaxRates.value[code], 2)}
						</option>
					))}
				</select>
			</div>
			<TextField
				label="Annual property tax (optional)"
				prefix="$"
				value={override}
				error={error}
				hint={`Leave blank to use the ${state} estimate.`}
				onChange={onOverrideChange}
				onBlur={onBlur}
			/>
		</>
	);
};

export default PropertyTaxFields;
