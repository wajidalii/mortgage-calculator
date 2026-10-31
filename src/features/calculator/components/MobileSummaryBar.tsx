import { formatMoney } from "@/lib/money";
import type { Cents } from "@/types/units";

interface MobileSummaryBarProps {
	total: Cents | null;
	/** The total is the last valid result, not the current inputs. */
	stale: boolean;
	/** Element id of the results area the link jumps to. */
	targetId: string;
	/** Hidden while the full estimate is already on screen. */
	hidden: boolean;
}

/**
 * Small screens only: keeps the monthly total in view while the user edits
 * inputs further up the page. Not a live region; the estimate itself is.
 */
const MobileSummaryBar = ({
	total,
	stale,
	targetId,
	hidden,
}: MobileSummaryBarProps) =>
	hidden ? null : (
		<div
			data-testid="mobile-summary"
			className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_28px_rgb(18_50_58/0.12)] backdrop-blur sm:hidden print:hidden"
		>
			<div className="min-w-0">
				<p className="text-xs font-semibold text-slate-600">
					Est. monthly cost
				</p>
				<p className="flex flex-wrap items-center gap-x-2">
					<span className="text-xl font-extrabold tracking-tight text-slate-900 tabular-nums">
						{total === null ? "Check your inputs" : formatMoney(total)}
					</span>
					{stale ? (
						<span className="whitespace-nowrap rounded bg-amber-100 px-1.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-400">
							<span aria-hidden="true">⚠ </span>Last valid entry
						</span>
					) : null}
				</p>
			</div>
			<a
				href={`#${targetId}`}
				className="flex min-h-11 shrink-0 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
			>
				See breakdown
			</a>
		</div>
	);

export default MobileSummaryBar;
