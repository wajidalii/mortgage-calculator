import ButtonLink from "@/components/ui/ButtonLink";
import Icon from "./Icon";
import PaymentPreview from "./PaymentPreview";

const HeroSection = () => (
	<section
		aria-labelledby="hero-title"
		className="bg-brand-900 text-white print:hidden"
	>
		<div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-8 lg:py-20">
			<div>
				<p className="text-xs font-bold tracking-widest text-brand-200 uppercase">
					Mortgage planner
				</p>
				<h1
					id="hero-title"
					className="mt-3 font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
				>
					See what a home will really cost you each month
				</h1>
				<p className="mt-5 max-w-xl text-lg text-brand-100">
					Principal and interest is only part of it. Add property tax,
					insurance, PMI and HOA, see the cash you need at closing, and test
					what extra payments or a refinance would change.
				</p>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<ButtonLink to="/calculator" variant="onDark" size="lg">
						Calculate my mortgage
						<Icon name="arrow" />
					</ButtonLink>
					<ButtonLink to="/compare" variant="outlineOnDark" size="lg">
						Compare loan options
					</ButtonLink>
				</div>
				<ul className="mt-8 flex flex-col gap-2 text-sm text-brand-100 sm:flex-row sm:gap-6">
					<li className="flex items-center gap-2">
						<Icon name="check" className="size-4 text-brand-200" />
						No account or sign-up
					</li>
					<li className="flex items-center gap-2">
						<Icon name="lock" className="size-4 text-brand-200" />
						Your numbers stay in your browser
					</li>
				</ul>
			</div>
			<div className="mx-auto w-full max-w-md lg:max-w-none">
				<PaymentPreview />
			</div>
		</div>
	</section>
);

export default HeroSection;
