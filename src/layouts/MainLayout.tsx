import { Suspense } from "react";
import { Outlet } from "react-router";
import PageLoader from "@/components/feedback/PageLoader";
import AppHeader from "@/components/layout/AppHeader";

const MainLayout = () => (
	<div className="flex min-h-screen flex-col">
		<AppHeader />
		<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
			<Suspense fallback={<PageLoader />}>
				<Outlet />
			</Suspense>
		</main>
	</div>
);

export default MainLayout;
