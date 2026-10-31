import { useId } from "react";
import { SEGMENT_GROUP, SEGMENT_OPTION } from "@/components/ui/segmented";
import { LOAN_TERMS, type LoanTerm } from "../types";

interface TermSelectorProps {
	value: LoanTerm;
	onChange: (years: LoanTerm) => void;
}

const TermSelector = ({ value, onChange }: TermSelectorProps) => {
	const name = useId();
	return (
		<fieldset>
			<legend className="text-sm font-semibold text-slate-800">
				Loan term
			</legend>
			<div className={`${SEGMENT_GROUP} grid-cols-3`}>
				{LOAN_TERMS.map((years) => (
					<label key={years} className="relative">
						<input
							type="radio"
							name={name}
							value={years}
							checked={value === years}
							onChange={() => onChange(years)}
							className="peer sr-only"
						/>
						<span className={SEGMENT_OPTION}>{years} years</span>
					</label>
				))}
			</div>
		</fieldset>
	);
};

export default TermSelector;
