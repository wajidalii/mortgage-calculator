import Reveal from "@/components/ui/Reveal";
import Icon, { type IconName } from "./Icon";
import SectionHeading from "./SectionHeading";

interface Audience {
	icon: IconName;
	who: string;
	question: string;
	points: readonly string[];
}

const AUDIENCES: readonly Audience[] = [
	{
		icon: "key",
		who: "First-time buyers",
		question: "How much house can I afford, and what will I need up front?",
		points: [
			"See cash to close, not only the monthly payment",
			"Learn what PMI costs and when it can end",
			"Check your debt ratios against lender guidelines",
		],
	},
	{
		icon: "home",
		who: "Current homeowners",
		question: "Should I refinance, or pay my loan off sooner?",
		points: [
			"Find your refinance break-even in months",
			"See how extra payments cut interest and shorten the loan",
			"Watch tax and insurance growth over the years",
		],
	},
	{
		icon: "briefcase",
		who: "Agents and loan professionals",
		question: "How do I show a client what their options look like?",
		points: [
			"Compare two loan structures side by side",
			"Save scenarios in the browser to reopen later",
			"Print a clean report for a conversation",
		],
	},
];

const AudienceSection = () => (
	<section aria-labelledby="audience-title" className="bg-brand-50">
		<div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
			<SectionHeading
				id="audience-title"
				eyebrow="Who it helps"
				title="Whether you are buying, owning or advising"
				intro="Everyone starts in the same place, and every tool is open to all. There is nothing to pick first."
			/>
			<Reveal className="mt-10">
				<ul className="grid grid-cols-1 gap-5 lg:grid-cols-3">
					{AUDIENCES.map((audience) => (
						<li
							key={audience.who}
							className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-brand-100 sm:p-7"
						>
							<span className="grid size-10 place-items-center rounded-full bg-brand-600 text-white">
								<Icon name={audience.icon} />
							</span>
							<h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
								{audience.who}
							</h3>
							<p className="mt-2 font-display text-lg text-slate-700 italic">
								{audience.question}
							</p>
							<ul className="mt-5 grid gap-3 border-t border-slate-200 pt-5 text-slate-700">
								{audience.points.map((point) => (
									<li key={point} className="flex gap-3">
										<Icon
											name="check"
											className="mt-0.5 size-5 shrink-0 text-brand-600"
										/>
										<span>{point}</span>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</Reveal>
		</div>
	</section>
);

export default AudienceSection;
