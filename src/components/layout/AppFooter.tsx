import { Link } from "react-router";
import { env } from "@/config/env";

const TOOLS = [
	{ to: "/calculator", label: "Mortgage calculator" },
	{ to: "/compare", label: "Compare two loans" },
	{ to: "/refinance", label: "Refinance break-even" },
] as const;

const LINK =
	"inline-flex min-h-11 items-center rounded text-slate-700 motion-safe:transition-colors motion-safe:duration-micro hover:text-brand-700 hover:underline";

const AppFooter = () => (
	<footer className="border-t border-slate-200 bg-white print:hidden">
		<div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.6fr_1fr] lg:px-8">
			<div>
				<p className="text-lg font-extrabold tracking-tight text-brand-900">
					{env.appName}
				</p>
				<p className="mt-2 max-w-sm text-sm text-slate-600">
					Plan the true cost of buying or owning a home. No account needed, and
					your inputs never leave your browser.
				</p>
			</div>
			<nav aria-label="Tools">
				<p className="text-xs font-bold tracking-widest text-slate-600 uppercase">
					Tools
				</p>
				<ul className="mt-2 text-sm">
					{TOOLS.map((tool) => (
						<li key={tool.to}>
							<Link to={tool.to} className={LINK}>
								{tool.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</div>
		<div className="border-t border-slate-200">
			<p className="mx-auto w-full max-w-7xl px-4 py-5 text-xs text-slate-600 sm:px-6 lg:px-8">
				Estimates only. Not a loan offer, a quote, or financial advice.
			</p>
		</div>
	</footer>
);

export default AppFooter;
