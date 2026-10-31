import ButtonLink from "@/components/ui/ButtonLink";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

const FinalCta = () => (
	<section
		aria-labelledby="cta-title"
		className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8"
	>
		<Reveal className="rounded-3xl bg-brand-900 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
			<h2
				id="cta-title"
				className="mx-auto max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
			>
				Know the number before you make the offer
			</h2>
			<p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
				It takes a minute to see your monthly cost, your cash to close and what
				the loan costs over time.
			</p>
			<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
				<ButtonLink to="/calculator" variant="onDark" size="lg">
					Calculate my mortgage
					<Icon
						name="arrow"
						className="size-5 motion-safe:transition-transform motion-safe:duration-hover group-hover:translate-x-0.5"
					/>
				</ButtonLink>
				<ButtonLink to="/refinance" variant="outlineOnDark" size="lg">
					Check refinance break-even
				</ButtonLink>
			</div>
		</Reveal>
	</section>
);

export default FinalCta;
