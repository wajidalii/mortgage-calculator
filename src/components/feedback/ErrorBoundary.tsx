import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import Button from "@/components/ui/Button";

const GENERIC_MESSAGE =
	"An unexpected error stopped this page. Your inputs were not sent anywhere. Reload to try again.";

/** A route response (such as 404) is safe to show; anything else stays in the console. */
const messageOf = (error: unknown): string =>
	isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: GENERIC_MESSAGE;

// Route errorElement: React Router catches render and loader errors in the
// routes and exposes them through useRouteError.
const ErrorBoundary = () => {
	const error = useRouteError();
	useEffect(() => {
		console.error(error);
	}, [error]);
	return (
		<div className="mx-auto max-w-md p-8 text-center" role="alert">
			<h1 className="text-2xl font-semibold">Something went wrong</h1>
			<p className="mt-2 text-slate-600">{messageOf(error)}</p>
			<div className="mt-6 flex justify-center gap-3">
				<Button onClick={() => window.location.reload()}>Reload</Button>
				<Button variant="secondary" onClick={() => window.location.assign("/")}>
					Back to home
				</Button>
			</div>
		</div>
	);
};

export default ErrorBoundary;
