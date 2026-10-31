import LoanCalculator from "@/features/calculator/components/LoanCalculator";

const CalculatorPage = () => (
	<div className="grid grid-cols-1 gap-6">
		<div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
			<div>
				<p className="text-xs font-extrabold uppercase tracking-widest text-brand-700">
					Plan with confidence
				</p>
				<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
					Mortgage calculator
				</h1>
				<p className="mt-2 max-w-2xl text-sm text-slate-600">
					Explore your monthly payment, upfront costs and long-term loan costs
					in one place.
				</p>
			</div>
			<p className="rounded-full bg-slate-200/70 px-3 py-1.5 text-xs text-slate-700">
				Local only · nothing you enter leaves your browser
			</p>
		</div>
		<LoanCalculator />
	</div>
);

export default CalculatorPage;
