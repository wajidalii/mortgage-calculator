import SectionHeading from "./SectionHeading";

interface Capability {
	title: string;
	body: string;
	details: readonly string[];
}

const CAPABILITIES: readonly Capability[] = [
	{
		title: "The real monthly number",
		body: "A bank's payment quote and your actual monthly cost are different things. The calculator itemizes both, so nothing arrives as a surprise after closing.",
		details: [
			"Principal and interest",
			"Property tax by state, or your own figure",
			"Homeowners insurance and HOA",
			"PMI, and when it can come off",
		],
	},
	{
		title: "Cash you need on closing day",
		body: "Compare your down payment options and see the full cash to close, including lender and title costs, prepaid items and any credits.",
		details: [
			"Down payment as a percent or a dollar amount",
			"Itemized closing costs",
			"Credits that lower the cash you bring",
		],
	},
	{
		title: "How fast you can own it",
		body: "See how much of each payment goes to interest, how the balance falls, and what paying a little extra saves.",
		details: [
			"Monthly and yearly amortization schedule",
			"Total interest over the loan",
			"Extra monthly or one-time payments, with the payoff date and interest saved",
		],
	},
	{
		title: "What happens if things change",
		body: "Rates move and costs rise. Test both before you commit to a payment you can only just afford.",
		details: [
			"Fixed-rate versus a 5/6 ARM, with the reset risk spelled out",
			"A table of payments at nearby rates",
			"Yearly growth in property tax and insurance",
		],
	},
	{
		title: "A sanity check on affordability",
		body: "Enter your income and monthly debts to see your housing payment and total debts as a share of income, and how they compare to common lender guidelines.",
		details: ["Housing payment ratio", "Total debt ratio"],
	},
];

const CapabilitiesSection = () => (
	<section aria-labelledby="capabilities-title" className="bg-white">
		<div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8">
			<div className="lg:sticky lg:top-8 lg:self-start">
				<SectionHeading
					id="capabilities-title"
					eyebrow="Inside the calculator"
					title="More than a payment figure"
					intro="Every part of the cost of a home, in one place, with results that update as you type."
				/>
			</div>
			<ol className="divide-y divide-slate-200 border-y border-slate-200">
				{CAPABILITIES.map((item, index) => (
					<li
						key={item.title}
						className="grid grid-cols-1 gap-4 py-7 sm:grid-cols-[3rem_1fr]"
					>
						<span
							aria-hidden="true"
							className="font-display text-3xl font-semibold text-brand-600 tabular-nums"
						>
							{String(index + 1).padStart(2, "0")}
						</span>
						<div>
							<h3 className="text-xl font-semibold tracking-tight text-slate-900">
								{item.title}
							</h3>
							<p className="mt-2 text-slate-600">{item.body}</p>
							<ul className="mt-4 flex flex-wrap gap-2">
								{item.details.map((detail) => (
									<li
										key={detail}
										className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-900 ring-1 ring-brand-100"
									>
										{detail}
									</li>
								))}
							</ul>
						</div>
					</li>
				))}
			</ol>
		</div>
	</section>
);

export default CapabilitiesSection;
