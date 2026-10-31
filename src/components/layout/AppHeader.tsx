import { Link, NavLink } from "react-router";
import { env } from "@/config/env";
import { cn } from "@/lib/cn";

const LINKS = [
	{ to: "/calculator", label: "Calculator" },
	{ to: "/compare", label: "Compare" },
	{ to: "/refinance", label: "Refinance" },
] as const;

const AppHeader = () => (
	<header className="border-b border-slate-200 bg-white print:hidden">
		<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
			<Link
				to="/"
				className="flex min-h-11 items-center gap-2.5 rounded-lg text-lg font-extrabold tracking-tight text-brand-900"
			>
				<span
					aria-hidden="true"
					className="grid size-9 place-items-center rounded-xl bg-brand-600 text-xl text-white"
				>
					⌂
				</span>
				{env.appName}
			</Link>
			<nav aria-label="Main">
				<ul className="flex flex-wrap gap-1 text-sm font-semibold">
					{LINKS.map((link) => (
						<li key={link.to}>
							<NavLink
								to={link.to}
								className={({ isActive }) =>
									cn(
										"flex min-h-11 items-center rounded-lg px-3",
										isActive
											? "bg-brand-50 text-brand-700"
											: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
									)
								}
							>
								{link.label}
							</NavLink>
						</li>
					))}
				</ul>
			</nav>
		</div>
	</header>
);

export default AppHeader;
