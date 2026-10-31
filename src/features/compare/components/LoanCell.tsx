import LoanTypeSelector from "@/features/calculator/components/LoanTypeSelector";
import TermSelector from "@/features/calculator/components/TermSelector";
import type { ScenarioInput } from "../compare";

interface LoanCellProps {
	scenario: ScenarioInput;
	onChange: (patch: Partial<ScenarioInput>) => void;
}

const LoanCell = ({ scenario, onChange }: LoanCellProps) => (
	<div className="grid gap-4 xl:grid-cols-2">
		<LoanTypeSelector
			value={scenario.loanType}
			onChange={(loanType) => onChange({ loanType })}
		/>
		<TermSelector
			value={scenario.termYears}
			onChange={(termYears) => onChange({ termYears })}
		/>
	</div>
);

export default LoanCell;
