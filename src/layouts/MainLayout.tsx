import { Suspense } from "react";
import { Outlet } from "react-router";
import PageLoader from "@/components/feedback/PageLoader";

const MainLayout = () => (
	<div className="flex min-h-screen flex-col">
		{/* Slot for a future <Navbar /> (render it here, above <main>). */}
		<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
			<Suspense fallback={<PageLoader />}>
				<Outlet />
			</Suspense>
		</main>
	</div>
);

export default MainLayout;
