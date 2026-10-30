import { Component, type ErrorInfo, type ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import Button from "@/components/ui/Button";

interface ErrorFallbackProps {
	message: string;
}

const ErrorFallback = ({ message }: ErrorFallbackProps) => (
	<div className="mx-auto max-w-md p-8 text-center" role="alert">
		<h1 className="text-2xl font-semibold">Something went wrong</h1>
		<p className="mt-2 text-slate-600">{message}</p>
		<Button className="mt-6" onClick={() => window.location.assign("/")}>
			Back to home
		</Button>
	</div>
);

interface BoundaryProps {
	children?: ReactNode;
}

interface BoundaryState {
	error: Error | null;
}

// Class component: React only supports error boundaries as classes.
// Catches render errors of its children when used as a wrapper.
class RenderBoundary extends Component<BoundaryProps, BoundaryState> {
	state: BoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): BoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error(error, info.componentStack);
	}

	render() {
		const { error } = this.state;
		return error ? (
			<ErrorFallback message={error.message} />
		) : (
			this.props.children
		);
	}
}

const messageOf = (error: unknown): string => {
	if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
	if (error instanceof Error) return error.message;
	return "Unexpected error";
};

// Route errorElement: React Router catches route errors itself and exposes
// them through useRouteError, so this is the arrow-function entry point.
const ErrorBoundary = () => {
	const error = useRouteError();
	return (
		<RenderBoundary>
			<ErrorFallback message={messageOf(error)} />
		</RenderBoundary>
	);
};

export default ErrorBoundary;
