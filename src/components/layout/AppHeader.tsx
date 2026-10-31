import { Link, NavLink } from "react-router";
import { env } from "@/config/env";
import { cn } from "@/lib/cn";

const LINKS = [
	{ to: "/calculator", label: "Calculator" },
	{ to: "/compare", label: "Compare loans" },
	{ to: "/refinance", label: "Refinance" },
] as const;

const AppHeader = () => (
	<header className="border-b border-slate-200 bg-white print:hidden">
		<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 sm:px-8">
			<Link
				to="/"
				className="flex min-h-11 items-center gap-2.5 rounded-md text-lg font-extrabold tracking-tight text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
			>
				<span
					aria-hidden="true"
					className="grid size-8 place-items-center rounded-lg bg-brand-600 text-lg text-white"
				>
					⌂
				</span>
				{env.appName}
			</Link>
			<nav aria-label="Main" className="-mx-2 flex gap-1 sm:mx-0">
				{LINKS.map((link) => (
					<NavLink
						key={link.to}
						to={link.to}
						className={({ isActive }) =>
							cn(
								"flex min-h-11 items-center rounded-md px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
								isActive
									? "bg-brand-50 text-brand-700"
									: "text-slate-700 hover:bg-slate-100",
							)
						}
					>
						{link.label}
					</NavLink>
				))}
			</nav>
		</div>
	</header>
);

export default AppHeader;
