import { useId } from "react";
import { LOAN_TERMS, type LoanTerm } from "../types";

interface TermSelectorProps {
	value: LoanTerm;
	onChange: (years: LoanTerm) => void;
}

const TermSelector = ({ value, onChange }: TermSelectorProps) => {
	const name = useId();
	return (
		<fieldset>
			<legend className="text-sm font-medium text-slate-800">Loan term</legend>
			<div className="mt-1 grid grid-cols-3 gap-2">
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
						<span className="flex cursor-pointer items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 peer-checked:bg-brand-600 peer-checked:text-white peer-checked:ring-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500">
							{years} years
						</span>
					</label>
				))}
			</div>
		</fieldset>
	);
};

export default TermSelector;
