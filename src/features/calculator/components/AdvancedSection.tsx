import { type ReactNode, useEffect, useRef, useState } from "react";

interface AdvancedSectionProps {
	title: string;
	description: string;
	/** Visible errors inside the section. The section opens when one appears. */
	errorCount?: number;
	defaultOpen?: boolean;
	children: ReactNode;
}

/**
 * A collapsible group of optional inputs. Uses native `<details>`, so it is
 * keyboard and screen reader friendly without extra ARIA. The summary shows
 * an error count in text, so a closed section never hides a problem.
 */
const AdvancedSection = ({
	title,
	description,
	errorCount = 0,
	defaultOpen = false,
	children,
}: AdvancedSectionProps) => {
	const [open, setOpen] = useState(defaultOpen);
	const previousErrors = useRef(errorCount);
	useEffect(() => {
		// Open when an error first appears, for example a credit that became too
		// large after the down payment changed elsewhere.
		if (errorCount > 0 && previousErrors.current === 0) setOpen(true);
		previousErrors.current = errorCount;
	}, [errorCount]);

	return (
		<details
			open={open}
			onToggle={(event) => setOpen(event.currentTarget.open)}
			className="group border-t border-slate-200"
		>
			<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 motion-safe:transition-colors motion-safe:duration-micro hover:text-brand-700">
				<span className="min-w-0">
					<span className="block text-sm font-bold text-slate-900">
						{title}
					</span>
					<span className="block text-xs text-slate-600">{description}</span>
				</span>
				<span className="flex shrink-0 items-center gap-2">
					{errorCount > 0 ? (
						<span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-300">
							<span aria-hidden="true">⚠ </span>
							{errorCount === 1 ? "1 issue" : `${errorCount} issues`}
						</span>
					) : null}
					<svg
						aria-hidden="true"
						viewBox="0 0 20 20"
						className="size-5 text-brand-600 motion-safe:transition-transform motion-safe:duration-expand motion-safe:ease-out-soft group-open:rotate-180"
					>
						<path
							d="M5 7.5l5 5 5-5"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
			</summary>
			<div className="grid gap-5 pt-2 pb-6 sm:grid-cols-2 motion-safe:group-open:animate-rise-quick">
				{children}
			</div>
		</details>
	);
};

export default AdvancedSection;
