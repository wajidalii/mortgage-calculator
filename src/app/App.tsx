import { Suspense } from "react";
import { RouterProvider } from "react-router";
import PageLoader from "@/components/feedback/PageLoader";
import Providers from "./providers";
import router from "./router";

const App = () => (
	<Providers>
		<Suspense fallback={<PageLoader />}>
			<RouterProvider router={router} />
		</Suspense>
	</Providers>
);

export default App;
