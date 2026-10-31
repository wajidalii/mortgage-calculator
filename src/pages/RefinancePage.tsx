import RefinanceCalculator from "@/features/refinance/components/RefinanceCalculator";

const RefinancePage = () => (
	<div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6">
		<h1 className="text-3xl font-bold tracking-tight">Refinance break-even</h1>
		<RefinanceCalculator />
	</div>
);

export default RefinancePage;
