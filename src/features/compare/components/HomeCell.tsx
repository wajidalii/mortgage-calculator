import TextField from "@/features/calculator/components/TextField";
import type { ScenarioInput } from "../compare";

interface HomeCellProps {
	scenario: ScenarioInput;
	priceError?: string | undefined;
	downError?: string | undefined;
	onChange: (patch: Partial<ScenarioInput>) => void;
	onPriceBlur: () => void;
	onDownBlur: () => void;
}

const HomeCell = ({
	scenario,
	priceError,
	downError,
	onChange,
	onPriceBlur,
	onDownBlur,
}: HomeCellProps) => (
	<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
		<TextField
			label="Home price"
			prefix="$"
			value={scenario.homePrice}
			error={priceError}
			onChange={(homePrice) => onChange({ homePrice })}
			onBlur={onPriceBlur}
		/>
		<TextField
			label="Down payment"
			suffix="%"
			value={scenario.downPaymentPercent}
			error={downError}
			onChange={(downPaymentPercent) => onChange({ downPaymentPercent })}
			onBlur={onDownBlur}
		/>
	</div>
);

export default HomeCell;
