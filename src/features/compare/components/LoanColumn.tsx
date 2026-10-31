import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LOAN_LABELS, LOAN_STYLE } from "../loanStyle";

interface LoanColumnProps {
	index: 0 | 1;
	/** Loan shown below the desktop breakpoint. */
	active: 0 | 1;
	/** Stacked sections: the first is the header, which pins to the top. */
	cells: { key: string; node: ReactNode }[];
}

const CELL = "min-w-0 border-x border-slate-200 bg-white px-4 py-4 sm:px-6";

/**
 * One loan as a column (a labelled group). From `lg` up the column joins the parent grid's rows
 * through subgrid, so section N of Loan A lines up with section N of Loan B
 * while the DOM (and Tab order) still reads one whole loan at a time. Below
 * `lg` only the active loan shows; the other keeps its state.
 */
const LoanColumn = ({ index, active, cells }: LoanColumnProps) => (
	// biome-ignore lint/a11y/useSemanticElements: a <fieldset> cannot be a subgrid container, and the rows must line up across both loans
	<div
		role="group"
		aria-label={LOAN_LABELS[index]}
		className={cn(
			"min-w-0 lg:row-span-7 lg:grid lg:grid-rows-subgrid",
			index !== active && "hidden lg:grid",
		)}
	>
		{cells.map((cell, position) => {
			const first = position === 0;
			const last = position === cells.length - 1;
			return (
				<div
					key={cell.key}
					className={cn(
						CELL,
						first &&
							cn(
								"rounded-t-2xl border-t-4 pt-5 shadow-panel lg:sticky lg:top-(--header-h,4.5rem) lg:z-20",
								LOAN_STYLE[index].accent,
							),
						!first && "border-t border-t-slate-100",
						last && "rounded-b-2xl border-b border-b-slate-200 pb-6",
					)}
				>
					{cell.node}
				</div>
			);
		})}
	</div>
);

export default LoanColumn;
