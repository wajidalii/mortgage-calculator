import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import ErrorBoundary from "@/components/feedback/ErrorBoundary";

const MainLayout = lazy(() => import("@/layouts/MainLayout"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const CalculatorPage = lazy(() => import("@/pages/CalculatorPage"));
const RefinancePage = lazy(() => import("@/pages/RefinancePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const router = createBrowserRouter([
	{
		path: "/",
		element: <MainLayout />,
		errorElement: <ErrorBoundary />,
		children: [
			{ index: true, element: <HomePage /> },
			{ path: "calculator", element: <CalculatorPage /> },
			{ path: "refinance", element: <RefinancePage /> },
			{ path: "*", element: <NotFoundPage /> },
		],
	},
]);

export default router;
