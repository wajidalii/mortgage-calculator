import SectionHeading from "./SectionHeading";

const STEPS = [
	{
		title: "Enter the basics",
		body: "Home price, down payment, interest rate, loan term and the state. Sensible defaults are filled in, so you can see a result right away.",
	},
	{
		title: "Read the full picture",
		body: "Watch the monthly total, cash to close and loan balance update as you type. Open the assumptions to review or change tax, insurance and PMI.",
	},
	{
		title: "Save, compare or print",
		body: "Save a scenario to come back to, compare two loans side by side, or print a clean report to take to a lender or an agent.",
	},
] as const;

const HowItWorksSection = () => (
	<section
		aria-labelledby="how-title"
		className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
	>
		<SectionHeading
			id="how-title"
			eyebrow="How it works"
			title="From a number to a decision in three steps"
		/>
		<ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
			{STEPS.map((step, index) => (
				<li key={step.title} className="relative md:pr-6">
					<span
						aria-hidden="true"
						className="grid size-10 place-items-center rounded-full bg-brand-600 text-base font-bold text-white"
					>
						{index + 1}
					</span>
					{index < STEPS.length - 1 ? (
						<span
							aria-hidden="true"
							className="absolute top-5 left-14 hidden h-px w-[calc(100%-4.5rem)] bg-brand-200 md:block"
						/>
					) : null}
					<h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
						{step.title}
					</h3>
					<p className="mt-2 text-slate-600">{step.body}</p>
				</li>
			))}
		</ol>
	</section>
);

export default HowItWorksSection;
