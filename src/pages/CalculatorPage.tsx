import LoanCalculator from "@/features/calculator/components/LoanCalculator";

const CalculatorPage = () => (
	<div className="grid gap-6">
		<h1 className="text-2xl font-semibold print:hidden">Calculator</h1>
		<LoanCalculator />
	</div>
);

export default CalculatorPage;
