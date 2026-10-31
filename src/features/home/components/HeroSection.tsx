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
				<p className="text-xs font-bold tracking-widest text-brand-200 uppercase motion-safe:animate-rise">
					Mortgage planner
				</p>
				<h1
					id="hero-title"
					style={{ animationDelay: "60ms" }}
					className="motion-safe:animate-rise mt-3 font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
				>
					See what a home will really cost you each month
				</h1>
				<p
					style={{ animationDelay: "140ms" }}
					className="mt-5 max-w-xl text-lg text-brand-100 motion-safe:animate-rise"
				>
					Principal and interest is only part of it. Add property tax,
					insurance, PMI and HOA, see the cash you need at closing, and test
					what extra payments or a refinance would change.
				</p>
				<div
					style={{ animationDelay: "220ms" }}
					className="mt-8 flex flex-col gap-3 sm:flex-row motion-safe:animate-rise"
				>
					<ButtonLink to="/calculator" variant="onDark" size="lg">
						Calculate my mortgage
						<Icon
							name="arrow"
							className="size-5 motion-safe:transition-transform motion-safe:duration-hover group-hover:translate-x-0.5"
						/>
					</ButtonLink>
					<ButtonLink to="/compare" variant="outlineOnDark" size="lg">
						Compare loan options
					</ButtonLink>
				</div>
				<ul
					style={{ animationDelay: "300ms" }}
					className="mt-8 flex flex-col gap-2 text-sm text-brand-100 sm:flex-row sm:gap-6 motion-safe:animate-rise"
				>
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
			<div
				style={{ animationDelay: "180ms" }}
				className="mx-auto w-full max-w-md lg:max-w-none motion-safe:animate-rise"
			>
				<PaymentPreview />
			</div>
		</div>
	</section>
);

export default HeroSection;
