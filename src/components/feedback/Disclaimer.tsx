import { DISCLAIMER_TEXT } from "@/config/disclaimer";

const Disclaimer = () => (
	<aside
		aria-label="Disclaimer"
		className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
	>
		<p>{DISCLAIMER_TEXT}</p>
	</aside>
);

export default Disclaimer;
