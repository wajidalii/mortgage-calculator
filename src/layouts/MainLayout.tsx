import { Suspense } from "react";
import { Outlet, useMatches } from "react-router";
import PageLoader from "@/components/feedback/PageLoader";
import AppFooter from "@/components/layout/AppFooter";
import AppHeader from "@/components/layout/AppHeader";
import { cn } from "@/lib/cn";

/** Routes mark themselves `handle: { fullBleed: true }` to own their width. */
const isFullBleed = (handle: unknown): boolean =>
	typeof handle === "object" &&
	handle !== null &&
	"fullBleed" in handle &&
	handle.fullBleed === true;

const MainLayout = () => {
	const fullBleed = useMatches().some((match) => isFullBleed(match.handle));
	return (
		<div className="flex min-h-screen flex-col">
			<a
				href="#main"
				className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-brand-700 shadow ring-2 ring-brand-500 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
			>
				Skip to content
			</a>
			<AppHeader />
			<main
				id="main"
				tabIndex={-1}
				className={cn(
					"w-full flex-1 outline-none print:max-w-none print:p-0",
					!fullBleed && "mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
				)}
			>
				<Suspense fallback={<PageLoader />}>
					<Outlet />
				</Suspense>
			</main>
			<AppFooter />
		</div>
	);
};

export default MainLayout;
