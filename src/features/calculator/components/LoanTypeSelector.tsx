import { useId } from "react";
import { SEGMENT_GROUP, SEGMENT_OPTION } from "@/components/ui/segmented";
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
			<legend className="text-sm font-semibold text-slate-800">
				Loan type
			</legend>
			<div className={`${SEGMENT_GROUP} grid-cols-2`}>
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
						<span className={SEGMENT_OPTION}>{option.label}</span>
					</label>
				))}
			</div>
		</fieldset>
	);
};

export default LoanTypeSelector;
