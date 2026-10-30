const PageLoader = () => (
	<div
		className="flex min-h-[50vh] items-center justify-center"
		role="status"
		aria-live="polite"
	>
		<span className="size-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
		<span className="sr-only">Loading</span>
	</div>
);

export default PageLoader;
