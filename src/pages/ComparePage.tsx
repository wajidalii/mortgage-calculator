import CompareView from "@/features/compare/components/CompareView";

const ComparePage = () => (
	<div className="grid w-full grid-cols-1 gap-6">
		<title>Compare two mortgages side by side | Mortgage Calculator</title>
		<header>
			<p className="text-xs font-bold tracking-widest text-brand-700 uppercase">
				Loan comparison
			</p>
			<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
				Compare two loans side by side
			</h1>
		</header>
		<CompareView />
	</div>
);

export default ComparePage;
