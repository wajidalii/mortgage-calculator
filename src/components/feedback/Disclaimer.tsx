import { DISCLAIMER_TEXT } from "@/config/disclaimer";

const Disclaimer = () => (
	// A note, not an aside: it sits inside <main>, and a complementary
	// landmark must be top level.
	<div
		role="note"
		aria-label="Disclaimer"
		className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700"
	>
		<p>{DISCLAIMER_TEXT}</p>
	</div>
);

export default Disclaimer;
