import { type ReactNode, useEffect, useState } from "react";

interface CollapsibleProps {
	title: string;
	/** One line under the title saying what is inside. */
	caption?: string;
	defaultOpen?: boolean;
	/** A field inside has an error: open the section and flag it. */
	invalid?: boolean;
	children: ReactNode;
}

/** A native <details> disclosure for a group of optional fields. */
const Collapsible = ({
	title,
	caption,
	defaultOpen = false,
	invalid = false,
	children,
}: CollapsibleProps) => {
	const [open, setOpen] = useState(defaultOpen);
	// An error in a closed section would be invisible, so open it.
	useEffect(() => {
		if (invalid) setOpen(true);
	}, [invalid]);

	return (
		<details
			open={open}
			onToggle={(event) => setOpen(event.currentTarget.open)}
			className="group border-t border-slate-200 py-2"
		>
			<summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 [&::-webkit-details-marker]:hidden">
				<span>
					<span className="block text-sm font-semibold text-slate-900">
						{title}
					</span>
					{caption ? (
						<span className="block text-xs text-slate-600">{caption}</span>
					) : null}
				</span>
				<span className="flex items-center gap-2">
					{invalid ? (
						<span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-300">
							<span aria-hidden="true">⚠ </span>Needs attention
						</span>
					) : null}
					<span
						aria-hidden="true"
						className="text-xl leading-none text-brand-700 group-open:hidden"
					>
						+
					</span>
					<span
						aria-hidden="true"
						className="hidden text-xl leading-none text-brand-700 group-open:inline"
					>
						−
					</span>
				</span>
			</summary>
			<div className="grid grid-cols-1 gap-5 pb-3 pt-3 @md:grid-cols-2">
				{children}
			</div>
		</details>
	);
};

export default Collapsible;
