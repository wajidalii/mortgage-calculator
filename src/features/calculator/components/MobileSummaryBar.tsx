import { formatMoney } from "@/lib/money";
import type { Cents } from "@/types/units";

interface MobileSummaryBarProps {
	total: Cents | null;
	/** Id of the results region to jump to. */
	targetId: string;
	stale?: boolean;
}

/** Keeps the monthly total in view on small screens, where the results sit below the form. */
const MobileSummaryBar = ({
	total,
	targetId,
	stale = false,
}: MobileSummaryBarProps) => (
	<section
		aria-label="Monthly total"
		className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2.5 shadow-[0_-8px_24px_rgba(18,50,58,0.12)] lg:hidden print:hidden"
	>
		<div className="min-w-0">
			<p className="text-xs text-slate-600">
				{stale ? "Last valid entry" : "Est. monthly cost"}
			</p>
			<p className="truncate text-xl font-bold tabular-nums text-slate-900">
				{total === null ? "Fix highlighted fields" : formatMoney(total)}
			</p>
		</div>
		<a
			href={`#${targetId}`}
			onClick={(event) => {
				event.preventDefault();
				const target = document.getElementById(targetId);
				target?.focus();
				target?.scrollIntoView({ block: "start" });
			}}
			className="flex min-h-11 items-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
		>
			See details
		</a>
	</section>
);

export default MobileSummaryBar;
