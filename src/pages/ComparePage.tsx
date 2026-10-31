import CompareView from "@/features/compare/components/CompareView";

const ComparePage = () => (
	<div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6">
		<h1 className="text-3xl font-bold tracking-tight">Compare two loans</h1>
		<CompareView />
	</div>
);

export default ComparePage;
