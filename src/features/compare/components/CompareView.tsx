import { useDeferredValue, useMemo, useState } from "react";
import Disclaimer from "@/components/feedback/Disclaimer";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import SavedScenarios from "@/features/scenarios/components/SavedScenarios";
import type { StorageLike } from "@/features/scenarios/storage";
import { parseCompareState } from "@/features/scenarios/validate";
import {
	buildMetrics,
	type CompareState,
	deriveComparison,
	duplicateFirstScenario,
	initialCompareState,
	type MetricId,
	type ScenarioInput,
	swapScenarios,
} from "../compare";
import { LOAN_LABELS } from "../loanStyle";
import CompareSummary from "./CompareSummary";
import HeaderCell from "./HeaderCell";
import HomeCell from "./HomeCell";
import LoanCell from "./LoanCell";
import LoanColumn from "./LoanColumn";
import LoanSwitch from "./LoanSwitch";
import RateCell from "./RateCell";
import ResultCell from "./ResultCell";

/** A field's message shows only after the user has left it. */
type Touched = Partial<Record<"homePrice" | "downPayment" | "rate", boolean>>;
type TouchedPair = [Touched, Touched];

const noneTouched: TouchedPair = [{}, {}];

interface CompareViewProps {
	/** Where saved scenarios go. Defaults to the browser's local storage. */
	storage?: StorageLike | null;
}

const CompareView = ({ storage }: CompareViewProps) => {
	const [state, setState] = useState<CompareState>(initialCompareState);
	const [touched, setTouched] = useState<TouchedPair>(noneTouched);
	const [active, setActive] = useState<0 | 1>(0);
	const [notice, setNotice] = useState("");
	const deferred = useDeferredValue(state);
	const comparison = useMemo(() => deriveComparison(deferred), [deferred]);
	const metrics = useMemo(() => buildMetrics(comparison), [comparison]);

	const touch = (index: 0 | 1, key: keyof Touched) =>
		setTouched((prev) => {
			const next: TouchedPair = [{ ...prev[0] }, { ...prev[1] }];
			next[index][key] = true;
			return next;
		});
	const setScenario = (index: 0 | 1, patch: Partial<ScenarioInput>) =>
		setState((prev) => {
			const scenarios: CompareState["scenarios"] = [...prev.scenarios];
			scenarios[index] = { ...prev.scenarios[index], ...patch };
			return { scenarios };
		});
	const shown = (index: 0 | 1, key: keyof Touched, message?: string) =>
		touched[index][key] ? message : undefined;

	const swap = () => {
		setState(swapScenarios);
		setTouched((prev) => [prev[1], prev[0]]);
		setNotice("Loans swapped. Loan A is now the former Loan B.");
	};
	const duplicate = () => {
		setState(duplicateFirstScenario);
		setTouched((prev) => [prev[0], { ...prev[0] }]);
		setNotice("Loan A copied to Loan B.");
	};

	const lowerFor = (index: 0 | 1) => (id: MetricId) =>
		metrics.find((metric) => metric.id === id)?.lower === index;

	return (
		<div className="grid grid-cols-1 gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="max-w-2xl text-slate-600">
					Edit either loan and both results update. Each loan keeps its own
					inputs, so changing one never moves the other.
				</p>
				<div className="flex flex-wrap gap-2">
					<Button variant="secondary" className="min-h-11" onClick={swap}>
						<Icon name="swap" className="size-4" />
						Swap loans
					</Button>
					<Button variant="secondary" className="min-h-11" onClick={duplicate}>
						<Icon name="copy" className="size-4" />
						Copy Loan A to Loan B
					</Button>
				</div>
			</div>
			<p role="status" className="sr-only">
				{notice}
			</p>

			<CompareSummary state={deferred} comparison={comparison} />

			<LoanSwitch
				active={active}
				onChange={setActive}
				comparison={comparison}
			/>

			<form
				noValidate
				onSubmit={(event) => event.preventDefault()}
				aria-label="Loan comparison"
				className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-6"
			>
				{([0, 1] as const).map((index) => {
					const scenario = state.scenarios[index];
					const result = comparison.scenarios[index];
					return (
						<LoanColumn
							key={LOAN_LABELS[index]}
							index={index}
							active={active}
							cells={[
								{
									key: "header",
									node: (
										<HeaderCell
											index={index}
											scenario={scenario}
											result={result}
										/>
									),
								},
								{
									key: "home",
									node: (
										<HomeCell
											scenario={scenario}
											priceError={shown(
												index,
												"homePrice",
												result.errors.homePrice,
											)}
											downError={shown(
												index,
												"downPayment",
												result.errors.downPayment,
											)}
											onChange={(patch) => setScenario(index, patch)}
											onPriceBlur={() => touch(index, "homePrice")}
											onDownBlur={() => touch(index, "downPayment")}
										/>
									),
								},
								{
									key: "loan",
									node: (
										<LoanCell
											scenario={scenario}
											onChange={(patch) => setScenario(index, patch)}
										/>
									),
								},
								{
									key: "rate",
									node: (
										<RateCell
											scenario={scenario}
											rateError={shown(
												index,
												"rate",
												result.errors.interestRate,
											)}
											onChange={(patch) => setScenario(index, patch)}
											onRateBlur={() => touch(index, "rate")}
										/>
									),
								},
								...SECTIONS.map((section) => ({
									key: section,
									node: (
										<>
											<h3 className="mb-2 text-xs font-bold tracking-widest text-slate-600 uppercase">
												{SECTION_LABEL[section]}
											</h3>
											<ResultCell
												section={section}
												index={index}
												result={result}
												isLower={lowerFor(index)}
											/>
										</>
									),
								})),
							]}
						/>
					);
				})}
			</form>

			<SavedScenarios
				kind="compare"
				current={state}
				parse={parseCompareState}
				onOpen={(saved) => {
					setState(saved);
					setTouched(noneTouched);
				}}
				{...(storage !== undefined ? { storage } : {})}
			/>
			<Disclaimer />
		</div>
	);
};

const SECTIONS = ["monthly", "upfront", "lifetime"] as const;

const SECTION_LABEL = {
	monthly: "Monthly cost",
	upfront: "Upfront",
	lifetime: "Over the life of the loan",
} as const;

export default CompareView;
