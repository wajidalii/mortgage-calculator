import { Link } from "react-router";
import Card from "@/components/ui/Card";
import { env } from "@/config/env";

const HomePage = () => (
	<Card>
		<h1 className="text-3xl font-bold">{env.appName}</h1>
		<p className="mt-2 text-slate-600">
			Estimate your monthly mortgage payment.
		</p>
		<div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
			<Link
				to="/calculator"
				className="font-medium text-brand-600 hover:underline"
			>
				Open calculator
			</Link>
			<Link
				to="/compare"
				className="font-medium text-brand-600 hover:underline"
			>
				Compare two loans
			</Link>
			<Link
				to="/refinance"
				className="font-medium text-brand-600 hover:underline"
			>
				Refinance break-even
			</Link>
		</div>
	</Card>
);

export default HomePage;
