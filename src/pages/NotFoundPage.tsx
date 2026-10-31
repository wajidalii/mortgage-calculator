import { Link } from "react-router";
import Card from "@/components/ui/Card";

const NotFoundPage = () => (
	<Card className="mx-auto w-full max-w-3xl">
		<title>Page not found | Mortgage Calculator</title>
		<h1 className="text-2xl font-semibold">Page not found</h1>
		<Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
			Go home
		</Link>
	</Card>
);

export default NotFoundPage;
