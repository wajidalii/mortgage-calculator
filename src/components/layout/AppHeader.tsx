import { useLayoutEffect, useRef } from "react";
import { Link, NavLink } from "react-router";
import { env } from "@/config/env";
import { cn } from "@/lib/cn";

const LINKS = [
	{ to: "/calculator", label: "Calculator" },
	{ to: "/compare", label: "Compare" },
	{ to: "/refinance", label: "Refinance" },
] as const;

const AppHeader = () => {
	const ref = useRef<HTMLElement>(null);

	// Publish the live height so sticky page elements can sit below the header.
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const root = document.documentElement;
		const publish = () =>
			root.style.setProperty("--header-h", `${el.offsetHeight}px`);
		publish();
		const observer = new ResizeObserver(publish);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<header
			ref={ref}
			className="sticky top-0 z-40 border-b border-slate-200 bg-white print:hidden"
		>
			<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
				<Link
					to="/"
					className="flex min-h-11 items-center gap-2.5 rounded-lg text-lg font-extrabold tracking-tight text-brand-900 motion-safe:transition-colors motion-safe:duration-hover hover:text-brand-700"
				>
					<span
						aria-hidden="true"
						className="grid size-9 place-items-center rounded-full bg-brand-600 text-xs font-extrabold tracking-tight text-white"
					>
						ARM
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
											"flex min-h-11 items-center rounded-lg px-3 motion-safe:transition-colors motion-safe:duration-hover active:bg-brand-100",
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
};

export default AppHeader;
