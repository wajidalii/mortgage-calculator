import type { AssumptionItem } from "../assumptions";

interface AssumptionsPanelProps {
	items: readonly AssumptionItem[];
}

const Item = ({ item }: { item: AssumptionItem }) => (
	<li className="grid gap-1 py-3 text-sm">
		<div className="flex flex-wrap items-baseline justify-between gap-x-4">
			<span className="font-medium text-slate-900">{item.label}</span>
			<span className="text-slate-900">{item.value}</span>
		</div>
		<div className="flex flex-wrap items-center gap-2">
			<span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-800 ring-1 ring-slate-300">
				{item.status}
			</span>
			{item.stale ? (
				<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-400">
					May be out of date
				</span>
			) : null}
			{item.asOf ? (
				<span className="text-slate-600">As of {item.asOf}</span>
			) : null}
			{item.confidence ? (
				<span className="text-slate-600">Confidence: {item.confidence}</span>
			) : null}
		</div>
		{item.source ? (
			<p className="text-slate-600">Source: {item.source}</p>
		) : null}
	</li>
);

const AssumptionsPanel = ({ items }: AssumptionsPanelProps) => (
	<details className="group rounded-2xl bg-white p-4 shadow-panel ring-1 ring-slate-200 sm:p-6">
		<summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-lg font-semibold">
			Assumptions and defaults
			<span
				aria-hidden="true"
				className="text-2xl leading-none font-normal text-brand-600 group-open:hidden"
			>
				+
			</span>
			<span
				aria-hidden="true"
				className="hidden text-2xl leading-none font-normal text-brand-600 group-open:inline"
			>
				−
			</span>
		</summary>
		{items.length > 0 ? (
			<>
				<p className="mt-2 text-sm text-slate-700">
					"Entered" values are yours. "Illustrative" values are defaults we
					chose. "Overridden" values are defaults you replaced.
				</p>
				<ul className="mt-2 divide-y divide-slate-100">
					{items.map((item) => (
						<Item key={item.id} item={item} />
					))}
				</ul>
			</>
		) : (
			<p className="mt-2 text-sm text-slate-700">
				Fix the highlighted fields to see the assumptions.
			</p>
		)}
	</details>
);

export default AssumptionsPanel;
