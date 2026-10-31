import { useValueFlash } from "@/hooks/useValueFlash";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import type { ScenarioInput, ScenarioResult } from "../compare";
import { LOAN_LABELS, LOAN_STYLE } from "../loanStyle";

interface HeaderCellProps {
	index: 0 | 1;
	scenario: ScenarioInput;
	result: ScenarioResult;
}

const HeaderCell = ({ index, scenario, result }: HeaderCellProps) => {
	const total = result.summary?.estimate?.total ?? null;
	const flash = useValueFlash(total, true);
	const isArm = scenario.loanType === "arm";
	return (
		<div className="flex items-start justify-between gap-3">
			<div className="flex min-w-0 items-center gap-3">
				<span
					aria-hidden="true"
					className={cn(
						"grid size-9 shrink-0 place-items-center rounded-lg text-base font-bold",
						LOAN_STYLE[index].badge,
					)}
				>
					{index === 0 ? "A" : "B"}
				</span>
				<div className="min-w-0">
					<h2 className="text-lg font-semibold text-slate-900">
						{LOAN_LABELS[index]}
					</h2>
					<p className="text-sm text-slate-600">
						{isArm
							? `5/6 ARM · ${scenario.termYears}-year term`
							: `${scenario.termYears}-year fixed`}
						{isArm ? (
							<span className="ml-2 whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-950 ring-1 ring-amber-400">
								Hypothetical rate
							</span>
						) : null}
					</p>
				</div>
			</div>
			<p className="shrink-0 text-right" aria-live="polite">
				<span
					key={flash}
					className={cn(
						"-mr-1.5 inline-block rounded-md px-1.5 text-xl font-bold tabular-nums text-slate-900",
						flash > 0 && "motion-safe:animate-flash",
					)}
				>
					{total === null ? "—" : formatMoney(total)}
				</span>
				<span className="block text-xs text-slate-600">per month</span>
			</p>
		</div>
	);
};

export default HeaderCell;
