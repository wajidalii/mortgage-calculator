import Disclaimer from "@/components/feedback/Disclaimer";
import Reveal from "@/components/ui/Reveal";
import Icon from "./Icon";
import SectionHeading from "./SectionHeading";

const NOTES = [
	{
		title: "Estimates, not quotes",
		body: "Results show what a loan could look like. Only a lender can tell you what you qualify for.",
	},
	{
		title: "Assumptions you can see and change",
		body: "Property tax, insurance, PMI and ARM index values start as illustrative defaults with their as-of dates. Review them in the assumptions panel and replace them with your own.",
	},
	{
		title: "Hypothetical rates are labeled",
		body: "If you model an adjustable-rate loan, any future rate is marked as hypothetical, next to a reset-risk warning.",
	},
	{
		title: "Your real costs may differ",
		body: "Actual financing terms, taxes and fees vary by lender and location. Check the numbers with a lender before you decide.",
	},
] as const;

const TransparencySection = () => (
	<section
		aria-labelledby="trust-title"
		className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
	>
		<Reveal className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
			<div>
				<SectionHeading
					id="trust-title"
					eyebrow="Straight talk"
					title="Honest about what these numbers are"
				/>
				<dl className="mt-8 grid gap-6">
					{NOTES.map((note) => (
						<div key={note.title} className="border-l-2 border-brand-500 pl-4">
							<dt className="font-semibold text-slate-900">{note.title}</dt>
							<dd className="mt-1 text-slate-600">{note.body}</dd>
						</div>
					))}
				</dl>
			</div>
			<div className="grid content-start gap-5">
				<div className="rounded-2xl bg-white p-6 shadow-panel ring-1 ring-slate-200 sm:p-8">
					<span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
						<Icon name="lock" className="size-6" />
					</span>
					<h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-900">
						Your numbers stay with you
					</h3>
					<p className="mt-2 text-slate-600">
						Everything you enter is calculated in your browser. Saved scenarios
						are stored in your browser's local storage, on this device only.
						They are never sent to a server, so there is no account to create.
					</p>
					<p className="mt-3 text-slate-600">
						That also means they live and die with the browser: clearing site
						data, or switching browser or device, removes them.
					</p>
				</div>
				<Disclaimer />
			</div>
		</Reveal>
	</section>
);

export default TransparencySection;
