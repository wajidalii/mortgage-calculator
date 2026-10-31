import { Link } from "react-router";
import Icon, { type IconName } from "./Icon";
import SectionHeading from "./SectionHeading";

interface Tool {
	to: string;
	icon: IconName;
	name: string;
	question: string;
	body: string;
	cta: string;
	wide?: boolean;
}

const TOOLS: readonly Tool[] = [
	{
		to: "/calculator",
		icon: "home",
		name: "Mortgage calculator",
		question: "What will owning this home cost me?",
		body: "Enter a price, down payment, rate and term. You get one itemized monthly total with tax, insurance, PMI and HOA, plus cash to close, the amortization schedule and the interest you will pay over the loan.",
		cta: "Open the calculator",
		wide: true,
	},
	{
		to: "/compare",
		icon: "scale",
		name: "Loan comparison",
		question: "Which of two loans is better?",
		body: "Put two loans side by side and see monthly principal and interest and lifetime interest for each, so a lower rate or a shorter term is a number, not a guess.",
		cta: "Compare two loans",
	},
	{
		to: "/refinance",
		icon: "refresh",
		name: "Refinance break-even",
		question: "Is refinancing worth it?",
		body: "Enter your balance, current and new rate, and the costs. See the monthly saving and how many months it takes to earn those costs back.",
		cta: "Check break-even",
	},
];

const ToolsSection = () => (
	<section
		aria-labelledby="tools-title"
		className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
	>
		<SectionHeading
			id="tools-title"
			eyebrow="Three tools"
			title="Plan the purchase, then plan what comes after"
			intro="Start with the calculator. Reach for the other two when you are weighing offers or wondering about your current loan."
		/>
		<ul className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
			{TOOLS.map((tool) => (
				<li key={tool.to} className={tool.wide ? "lg:col-span-2" : undefined}>
					<Link
						to={tool.to}
						className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-panel ring-1 ring-slate-200 motion-safe:transition-shadow hover:ring-brand-500 sm:p-8"
					>
						<span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
							<Icon name={tool.icon} className="size-6" />
						</span>
						<span className="mt-5 text-xs font-bold tracking-widest text-slate-600 uppercase">
							{tool.name}
						</span>
						<h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-900">
							{tool.question}
						</h3>
						<p
							className={`mt-3 text-slate-600 ${tool.wide ? "max-w-3xl" : ""}`}
						>
							{tool.body}
						</p>
						<span className="mt-6 inline-flex min-h-11 items-center gap-2 pt-2 text-sm font-semibold text-brand-700 group-hover:underline">
							{tool.cta}
							<Icon
								name="arrow"
								className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
							/>
						</span>
					</Link>
				</li>
			))}
		</ul>
	</section>
);

export default ToolsSection;
