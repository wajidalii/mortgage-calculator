import LoanCalculator from "@/features/calculator/components/LoanCalculator";

const CalculatorPage = () => (
	<div className="grid grid-cols-1 gap-6">
		<title>Mortgage calculator: monthly cost and cash to close</title>
		<header className="print:hidden">
			<p className="text-xs font-bold tracking-widest text-brand-700 uppercase">
				Mortgage planner
			</p>
			<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
				Know the true cost of your home
			</h1>
			<p className="mt-2 max-w-2xl text-slate-600">
				Estimate your monthly ownership cost, cash to close and how the loan
				balance falls over time. Results update as you type.
			</p>
		</header>
		<LoanCalculator />
	</div>
);

export default CalculatorPage;
