import { useId } from "react";
import { DEFAULTS } from "@/config/defaults/defaults";
import { formatPercent } from "@/lib/rate";
import TextField from "./TextField";

interface PmiFieldsProps {
	/** LTV above 80%. */
	required: boolean;
	on: boolean;
	rate: string;
	error?: string | undefined;
	onToggle: (on: boolean) => void;
	onRateChange: (value: string) => void;
	onBlur: () => void;
}

const PmiFields = ({
	required,
	on,
	rate,
	error,
	onToggle,
	onRateChange,
	onBlur,
}: PmiFieldsProps) => {
	const id = useId();
	if (!required) return null;
	return (
		<>
			<div className="flex items-center gap-2 self-end pb-2">
				<input
					id={id}
					type="checkbox"
					checked={on}
					onChange={(event) => onToggle(event.target.checked)}
					className="size-4 accent-brand-600"
				/>
				<label htmlFor={id} className="text-sm font-medium text-slate-800">
					Include PMI (loan is above 80% of the price)
				</label>
			</div>
			{on ? (
				<TextField
					label="PMI rate (per year)"
					suffix="%"
					value={rate}
					error={error}
					hint={`Leave blank to use an illustrative ${formatPercent(DEFAULTS.pmiRate.value, 2)}.`}
					onChange={onRateChange}
					onBlur={onBlur}
				/>
			) : null}
		</>
	);
};

export default PmiFields;
