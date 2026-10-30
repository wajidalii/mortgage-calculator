import { Link } from "react-router";
import Card from "@/components/ui/Card";
import { env } from "@/config/env";

const HomePage = () => (
	<Card>
		<h1 className="text-3xl font-bold">{env.appName}</h1>
		<p className="mt-2 text-slate-600">
			Estimate your monthly mortgage payment.
		</p>
		<Link
			to="/calculator"
			className="mt-6 inline-block font-medium text-brand-600 hover:underline"
		>
			Open calculator
		</Link>
	</Card>
);

export default HomePage;
