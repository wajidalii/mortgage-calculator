import { cn } from "@/lib/cn";

interface SectionHeadingProps {
	id: string;
	eyebrow: string;
	title: string;
	intro?: string;
	className?: string;
}

const SectionHeading = ({
	id,
	eyebrow,
	title,
	intro,
	className,
}: SectionHeadingProps) => (
	<div className={cn("max-w-2xl", className)}>
		<p className="text-xs font-bold tracking-widest text-brand-700 uppercase">
			{eyebrow}
		</p>
		<h2
			id={id}
			className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-4xl"
		>
			{title}
		</h2>
		{intro ? (
			<p className="mt-3 text-base text-slate-600 sm:text-lg">{intro}</p>
		) : null}
	</div>
);

export default SectionHeading;
