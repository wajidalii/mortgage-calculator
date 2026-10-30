import Disclaimer from "@/components/feedback/Disclaimer";
import LoanCalculator from "@/features/calculator/components/LoanCalculator";

const CalculatorPage = () => (
	<div className="grid gap-6">
		<h1 className="text-2xl font-semibold">Calculator</h1>
		<LoanCalculator />
		<Disclaimer />
	</div>
);

export default CalculatorPage;
