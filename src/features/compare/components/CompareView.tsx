import { useDeferredValue, useMemo, useState } from "react";
import Disclaimer from "@/components/feedback/Disclaimer";
import Card from "@/components/ui/Card";
import TextField from "@/features/calculator/components/TextField";
import SavedScenarios from "@/features/scenarios/components/SavedScenarios";
import type { StorageLike } from "@/features/scenarios/storage";
import { parseCompareState } from "@/features/scenarios/validate";
import {
	type CompareShared,
	type CompareState,
	deriveComparison,
	initialCompareState,
	type ScenarioInput,
} from "../compare";
import CompareResults from "./CompareResults";
import ScenarioFields from "./ScenarioFields";

type Touched = Partial<
	Record<"homePrice" | "downPayment" | "rate0" | "rate1", boolean>
>;

const TITLES: [string, string] = ["Loan A", "Loan B"];

interface CompareViewProps {
	/** Where saved scenarios go. Defaults to the browser's local storage. */
	storage?: StorageLike | null;
}

const CompareView = ({ storage }: CompareViewProps) => {
	const [state, setState] = useState<CompareState>(initialCompareState);
	const [touched, setTouched] = useState<Touched>({});
	const deferred = useDeferredValue(state);
	const comparison = useMemo(() => deriveComparison(deferred), [deferred]);
	const touch = (key: keyof Touched) =>
		setTouched((prev) => ({ ...prev, [key]: true }));

	const setShared = (patch: Partial<CompareShared>) =>
		setState((prev) => ({ ...prev, shared: { ...prev.shared, ...patch } }));
	const setScenario = (index: 0 | 1, patch: Partial<ScenarioInput>) =>
		setState((prev) => {
			const scenarios: CompareState["scenarios"] = [
				...prev.scenarios,
			] as CompareState["scenarios"];
			scenarios[index] = { ...prev.scenarios[index], ...patch };
			return { ...prev, scenarios };
		});

	return (
		<div className="grid gap-6">
			<SavedScenarios
				kind="compare"
				current={state}
				parse={parseCompareState}
				onOpen={(saved) => {
					setState(saved);
					setTouched({});
				}}
				{...(storage !== undefined ? { storage } : {})}
			/>
			<Card className="grid gap-5">
				<div className="grid gap-5 sm:grid-cols-2">
					<TextField
						label="Home price"
						prefix="$"
						value={state.shared.homePrice}
						error={
							touched.homePrice ? comparison.sharedErrors.homePrice : undefined
						}
						onChange={(homePrice) => setShared({ homePrice })}
						onBlur={() => touch("homePrice")}
					/>
					<TextField
						label="Down payment"
						suffix="%"
						value={state.shared.downPaymentPercent}
						error={
							touched.downPayment
								? comparison.sharedErrors.downPayment
								: undefined
						}
						onChange={(downPaymentPercent) => setShared({ downPaymentPercent })}
						onBlur={() => touch("downPayment")}
					/>
				</div>
				<div className="grid gap-5 lg:grid-cols-2">
					{([0, 1] as const).map((index) => (
						<ScenarioFields
							key={TITLES[index]}
							title={TITLES[index]}
							scenario={state.scenarios[index]}
							rateError={
								touched[index === 0 ? "rate0" : "rate1"]
									? comparison.scenarios[index].errors.interestRate
									: undefined
							}
							onChange={(patch) => setScenario(index, patch)}
							onRateBlur={() => touch(index === 0 ? "rate0" : "rate1")}
						/>
					))}
				</div>
			</Card>
			<CompareResults titles={TITLES} comparison={comparison} />
			<Disclaimer />
		</div>
	);
};

export default CompareView;
