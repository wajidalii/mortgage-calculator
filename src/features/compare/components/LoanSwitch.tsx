import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import type { Comparison } from "../compare";
import { LOAN_LABELS, LOAN_STYLE } from "../loanStyle";

interface LoanSwitchProps {
	active: 0 | 1;
	onChange: (index: 0 | 1) => void;
	comparison: Comparison;
}

/**
 * Below the desktop breakpoint only one loan is on screen. This sticky switch
 * picks which, and keeps both monthly totals visible. Both loans stay in
 * state either way.
 */
const LoanSwitch = ({ active, onChange, comparison }: LoanSwitchProps) => (
	<fieldset className="sticky top-0 z-30 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 shadow-sm ring-1 ring-slate-200 lg:hidden">
		<legend className="sr-only">Show loan</legend>
		{([0, 1] as const).map((index) => {
			const total = comparison.scenarios[index].summary?.estimate?.total;
			return (
				<button
					key={LOAN_LABELS[index]}
					type="button"
					aria-pressed={active === index}
					onClick={() => onChange(index)}
					className={cn(
						"grid min-h-12 place-items-center rounded-lg px-2 py-1 text-sm font-semibold motion-safe:transition-[color,background-color,box-shadow,translate,scale] motion-safe:duration-micro motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.97]",
						active === index
							? LOAN_STYLE[index].active
							: "text-slate-700 hover:bg-white/80",
					)}
				>
					{LOAN_LABELS[index]}
					<span className="text-xs font-medium tabular-nums opacity-90">
						{total === undefined ? "—" : `${formatMoney(total)}/mo`}
					</span>
				</button>
			);
		})}
	</fieldset>
);

export default LoanSwitch;
