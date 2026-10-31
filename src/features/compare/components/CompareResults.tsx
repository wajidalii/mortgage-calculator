import { formatMoney } from "@/lib/money";
import { formatRate } from "@/lib/rate";
import type { Comparison, ScenarioResult } from "../compare";

interface CompareResultsProps {
	titles: [string, string];
	comparison: Comparison;
}

/** The PRD 8.5 label. Text, so it never relies on color alone. */
const HypotheticalBadge = () => (
	<span className="ml-2 whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-400">
		Hypothetical rate
	</span>
);

const CELL = "px-3 py-2 text-right tabular-nums align-top";

const Row = ({
	label,
	cells,
}: {
	label: string;
	cells: [React.ReactNode, React.ReactNode];
}) => (
	<tr>
		<th scope="row" className="px-3 py-2 text-left font-normal text-slate-700">
			{label}
		</th>
		<td className={CELL}>{cells[0]}</td>
		<td className={CELL}>{cells[1]}</td>
	</tr>
);

const cell = (
	result: ScenarioResult,
	render: (s: NonNullable<ScenarioResult["summary"]>) => React.ReactNode,
): React.ReactNode => (result.summary ? render(result.summary) : "—");

const CompareResults = ({ titles, comparison }: CompareResultsProps) => {
	const [a, b] = comparison.scenarios;
	const hasArm = a.summary?.isArm || b.summary?.isArm;
	return (
		<section
			aria-labelledby="compare-heading"
			className="rounded-lg bg-white p-4 ring-1 ring-slate-300 sm:p-6"
		>
			<h2 id="compare-heading" className="text-sm font-medium text-slate-700">
				Comparison
			</h2>
			<section
				// biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
				tabIndex={0}
				aria-label="Comparison table"
				className="mt-2 overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-500"
			>
				<table aria-live="polite" className="w-full min-w-[24rem] text-sm">
					<caption className="sr-only">
						Monthly principal and interest and lifetime interest for two loans
					</caption>
					<thead className="bg-slate-100 text-slate-700">
						<tr>
							<td className="px-3 py-2" />
							{[a, b].map((result, index) => (
								<th
									key={titles[index]}
									scope="col"
									className="px-3 py-2 text-right font-medium"
								>
									{titles[index]}
									{result.summary?.isArm ? <HypotheticalBadge /> : null}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						<Row
							label="Loan"
							cells={[
								cell(a, (s) =>
									s.isArm ? "5/6 ARM" : `${s.loan.termYears}-year fixed`,
								),
								cell(b, (s) =>
									s.isArm ? "5/6 ARM" : `${s.loan.termYears}-year fixed`,
								),
							]}
						/>
						<Row
							label="Rate"
							cells={[
								cell(a, (s) => formatRate(s.loan.interestRate)),
								cell(b, (s) => formatRate(s.loan.interestRate)),
							]}
						/>
						<Row
							label="Monthly principal and interest"
							cells={[
								cell(a, (s) => <strong>{formatMoney(s.payment)}</strong>),
								cell(b, (s) => <strong>{formatMoney(s.payment)}</strong>),
							]}
						/>
						{hasArm ? (
							<Row
								label="Highest payment (ARM, assumed index)"
								cells={[
									cell(a, (s) =>
										s.peakPayment ? formatMoney(s.peakPayment) : "Same",
									),
									cell(b, (s) =>
										s.peakPayment ? formatMoney(s.peakPayment) : "Same",
									),
								]}
							/>
						) : null}
						<Row
							label="Lifetime interest"
							cells={[
								cell(a, (s) => (
									<strong>{formatMoney(s.lifetimeInterest)}</strong>
								)),
								cell(b, (s) => (
									<strong>{formatMoney(s.lifetimeInterest)}</strong>
								)),
							]}
						/>
					</tbody>
				</table>
			</section>
			{hasArm ? (
				<p className="mt-3 text-xs text-slate-600">
					ARM figures after month 60 use an index path we assumed. The real rate
					may be higher or lower.
				</p>
			) : null}
		</section>
	);
};

export default CompareResults;
