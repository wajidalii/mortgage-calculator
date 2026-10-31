import { useId, useState } from "react";
import Button from "@/components/ui/Button";
import TextField from "@/features/calculator/components/TextField";
import type { ScenarioKind, StorageLike } from "../storage";
import { useSavedScenarios } from "../useSavedScenarios";

interface SavedScenariosProps<T> {
	kind: ScenarioKind;
	/** The inputs to save. */
	current: T;
	/** Checks a stored value and returns it as T, or null if unusable. */
	parse: (data: unknown) => T | null;
	onOpen: (data: T) => void;
	storage?: StorageLike | null;
}

const SavedScenarios = <T,>({
	kind,
	current,
	parse,
	onOpen,
	storage,
}: SavedScenariosProps<T>) => {
	const headingId = useId();
	const [name, setName] = useState("");
	const [confirming, setConfirming] = useState<string | null>(null);
	const { scenarios, message, setMessage, blocked, save, remove } =
		useSavedScenarios({ kind, ...(storage !== undefined ? { storage } : {}) });

	return (
		<section
			aria-labelledby={headingId}
			className="grid gap-3 rounded-lg bg-white p-4 ring-1 ring-slate-300 sm:p-6"
		>
			<h2 id={headingId} className="text-sm font-medium text-slate-700">
				Saved scenarios
			</h2>
			<p className="text-xs text-slate-600">
				Scenarios stay in this browser on this device. They are never sent to a
				server.
			</p>
			<form
				noValidate
				className="flex flex-wrap items-end gap-3"
				onSubmit={(event) => {
					event.preventDefault();
					if (save(name, current)) setName("");
				}}
			>
				<TextField
					className="min-w-48 flex-1"
					label="Scenario name"
					value={name}
					onChange={setName}
					onBlur={() => {}}
				/>
				<Button type="submit">Save</Button>
			</form>
			{message ? (
				<p role="status" className="text-sm font-medium text-slate-800">
					{message}
				</p>
			) : null}
			{scenarios.length > 0 ? (
				<ul className="divide-y divide-slate-100">
					{scenarios.map((item) => (
						<li
							key={item.id}
							className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
						>
							<span>
								<span className="font-medium text-slate-900">{item.name}</span>{" "}
								<span className="text-slate-600">
									{item.savedAt.slice(0, 10)}
								</span>
							</span>
							{confirming === item.id ? (
								<span className="flex flex-wrap items-center gap-2">
									<span>Delete "{item.name}"?</span>
									<Button
										variant="secondary"
										onClick={() => {
											remove(item.id);
											setConfirming(null);
										}}
									>
										Confirm delete
									</Button>
									<Button
										variant="secondary"
										onClick={() => setConfirming(null)}
									>
										Cancel
									</Button>
								</span>
							) : (
								<span className="flex gap-2">
									<Button
										variant="secondary"
										aria-label={`Open ${item.name}`}
										onClick={() => {
											const data = parse(item.data);
											if (data === null) {
												setMessage("This saved scenario could not be opened.");
											} else {
												onOpen(data);
												setMessage(`Opened "${item.name}".`);
											}
										}}
									>
										Open
									</Button>
									<Button
										variant="secondary"
										aria-label={`Delete ${item.name}`}
										onClick={() => setConfirming(item.id)}
									>
										Delete
									</Button>
								</span>
							)}
						</li>
					))}
				</ul>
			) : blocked ? null : (
				<p className="text-sm text-slate-600">No saved scenarios yet.</p>
			)}
		</section>
	);
};

export default SavedScenarios;
