import { Suspense } from "react";
import { RouterProvider } from "react-router";
import PageLoader from "@/components/feedback/PageLoader";
import router from "./router";

const App = () => (
	<Suspense fallback={<PageLoader />}>
		<RouterProvider router={router} />
	</Suspense>
);

export default App;
