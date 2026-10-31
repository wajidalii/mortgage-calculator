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
			<div className="flex min-h-12 items-center gap-3 self-end rounded-xl bg-slate-50 px-3 ring-1 ring-slate-200">
				<input
					id={id}
					type="checkbox"
					checked={on}
					onChange={(event) => onToggle(event.target.checked)}
					className="size-5 shrink-0 accent-brand-600"
				/>
				<label
					htmlFor={id}
					className="cursor-pointer py-2 text-sm font-semibold text-slate-800"
				>
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
