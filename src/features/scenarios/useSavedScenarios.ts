import { useCallback, useState } from "react";
import {
	cleanName,
	getBrowserStorage,
	loadScenarios,
	newId,
	type SavedScenario,
	type ScenarioKind,
	type StorageLike,
	writeScenarios,
} from "./storage";

export const UNAVAILABLE_MESSAGE =
	"Saving is not available in this browser. The calculator still works.";
const NEWER_MESSAGE =
	"Saved scenarios were made by a newer version of this app, so they are not shown.";
const WRITE_FAILED_MESSAGE =
	"Saving is not available: the browser refused to store the scenario. The calculator still works.";

interface Options {
	kind: ScenarioKind;
	/** Defaults to the browser's local storage. Null means unavailable. */
	storage?: StorageLike | null;
	now?: () => Date;
}

/**
 * Saved scenarios of one kind. The list is read once on mount; every change
 * reads the full list again before writing so two tabs do not overwrite each
 * other's saves.
 */
export const useSavedScenarios = ({ kind, storage, now }: Options) => {
	const [store] = useState<StorageLike | null>(() =>
		storage === undefined ? getBrowserStorage() : storage,
	);
	const [initial] = useState(() => loadScenarios(store));
	const [all, setAll] = useState<SavedScenario[]>(
		initial.ok ? initial.scenarios : [],
	);
	const blocked = !initial.ok;
	const blockedMessage =
		!initial.ok && initial.reason === "newer-version"
			? NEWER_MESSAGE
			: UNAVAILABLE_MESSAGE;
	const [message, setMessage] = useState<string | null>(
		blocked ? blockedMessage : null,
	);

	const commit = useCallback(
		(change: (current: SavedScenario[]) => SavedScenario[]): boolean => {
			const fresh = loadScenarios(store);
			if (!fresh.ok) {
				setMessage(UNAVAILABLE_MESSAGE);
				return false;
			}
			const next = change(fresh.scenarios);
			if (!writeScenarios(store, next)) {
				setMessage(WRITE_FAILED_MESSAGE);
				return false;
			}
			setAll(next);
			return true;
		},
		[store],
	);

	const save = useCallback(
		(name: string, data: unknown): boolean => {
			const clean = cleanName(name);
			if (blocked) {
				setMessage(blockedMessage);
				return false;
			}
			if (clean === "") {
				setMessage("Enter a name for the scenario.");
				return false;
			}
			const taken = all.some(
				(item) =>
					item.kind === kind && item.name.toLowerCase() === clean.toLowerCase(),
			);
			if (taken) {
				setMessage(
					`A scenario named "${clean}" already exists. Choose another name or delete the old one.`,
				);
				return false;
			}
			const scenario: SavedScenario = {
				id: newId(),
				name: clean,
				kind,
				savedAt: (now?.() ?? new Date()).toISOString(),
				data: JSON.parse(JSON.stringify(data)),
			};
			const saved = commit((current) => [...current, scenario]);
			if (saved) setMessage(`Saved "${clean}".`);
			return saved;
		},
		[all, blocked, blockedMessage, commit, kind, now],
	);

	const remove = useCallback(
		(id: string) => {
			if (commit((current) => current.filter((item) => item.id !== id))) {
				setMessage("Scenario deleted.");
			}
		},
		[commit],
	);

	return {
		scenarios: all.filter((item) => item.kind === kind),
		message,
		setMessage,
		blocked,
		save,
		remove,
	};
};
