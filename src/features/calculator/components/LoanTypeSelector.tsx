import { useId } from "react";
import type { LoanType } from "../types";

interface LoanTypeSelectorProps {
	value: LoanType;
	onChange: (loanType: LoanType) => void;
}

const OPTIONS: { value: LoanType; label: string }[] = [
	{ value: "fixed", label: "Fixed rate" },
	{ value: "arm", label: "5/6 ARM" },
];

const LoanTypeSelector = ({ value, onChange }: LoanTypeSelectorProps) => {
	const name = useId();
	return (
		<fieldset>
			<legend className="text-sm font-medium text-slate-800">Loan type</legend>
			<div className="mt-1 grid grid-cols-2 gap-2">
				{OPTIONS.map((option) => (
					<label key={option.value} className="relative">
						<input
							type="radio"
							name={name}
							value={option.value}
							checked={value === option.value}
							onChange={() => onChange(option.value)}
							className="peer sr-only"
						/>
						<span className="flex cursor-pointer items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 peer-checked:bg-brand-600 peer-checked:text-white peer-checked:ring-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500">
							{option.label}
						</span>
					</label>
				))}
			</div>
		</fieldset>
	);
};

export default LoanTypeSelector;
