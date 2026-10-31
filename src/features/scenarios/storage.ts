import { upgradeLegacyCompare } from "@/features/compare/compare";

/**
 * Saved scenarios live in browser storage only. Nothing here touches the
 * network (S-18). Every storage call is wrapped in try/catch because storage
 * can be blocked (private mode, site settings) or full.
 */

export const STORAGE_KEY = "mortgage-calculator:scenarios";
/** Bump when the saved shape changes and add a step to `migrate`. */
export const SCHEMA_VERSION = 2;
export const MAX_NAME_LENGTH = 60;

export type ScenarioKind = "calculator" | "compare";

export interface SavedScenario {
	id: string;
	name: string;
	kind: ScenarioKind;
	/** ISO timestamp. */
	savedAt: string;
	/** The inputs, as the feature's own JSON-serializable state. */
	data: unknown;
}

interface Envelope {
	version: number;
	scenarios: SavedScenario[];
}

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** The browser's local storage, or null when it cannot be used. */
export const getBrowserStorage = (): StorageLike | null => {
	try {
		const storage = window.localStorage;
		const probe = `${STORAGE_KEY}:probe`;
		storage.setItem(probe, "1");
		storage.getItem(probe);
		return storage;
	} catch {
		return null;
	}
};

export type LoadResult =
	| { ok: true; scenarios: SavedScenario[] }
	| { ok: false; reason: "unavailable" | "newer-version" };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isScenario = (value: unknown): value is SavedScenario =>
	isRecord(value) &&
	typeof value.id === "string" &&
	typeof value.name === "string" &&
	(value.kind === "calculator" || value.kind === "compare") &&
	typeof value.savedAt === "string" &&
	"data" in value;

/**
 * Brings an older saved envelope up to SCHEMA_VERSION.
 * 1 to 2: a saved comparison gave each loan its own price and down payment
 * instead of sharing one pair.
 */
const migrate = (envelope: Envelope): Envelope => {
	if (envelope.version >= 2) return envelope;
	return {
		version: 2,
		scenarios: envelope.scenarios.map((scenario) =>
			scenario.kind === "compare"
				? { ...scenario, data: upgradeLegacyCompare(scenario.data) }
				: scenario,
		),
	};
};

export const loadScenarios = (storage: StorageLike | null): LoadResult => {
	if (!storage) return { ok: false, reason: "unavailable" };
	let raw: string | null;
	try {
		raw = storage.getItem(STORAGE_KEY);
	} catch {
		return { ok: false, reason: "unavailable" };
	}
	if (raw === null) return { ok: true, scenarios: [] };
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { ok: true, scenarios: [] };
	}
	if (!isRecord(parsed) || typeof parsed.version !== "number") {
		return { ok: true, scenarios: [] };
	}
	// Data from a newer app version is left alone: reading it could misread it
	// and saving over it would destroy it.
	if (parsed.version > SCHEMA_VERSION) {
		return { ok: false, reason: "newer-version" };
	}
	const list = Array.isArray(parsed.scenarios) ? parsed.scenarios : [];
	const migrated = migrate({
		version: parsed.version,
		scenarios: list.filter(isScenario),
	});
	return { ok: true, scenarios: migrated.scenarios };
};

/** Writes the whole list. False when storage refuses the write. */
export const writeScenarios = (
	storage: StorageLike | null,
	scenarios: readonly SavedScenario[],
): boolean => {
	if (!storage) return false;
	const envelope: Envelope = {
		version: SCHEMA_VERSION,
		scenarios: [...scenarios],
	};
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
		return true;
	} catch {
		return false;
	}
};

export const cleanName = (name: string): string =>
	name.trim().slice(0, MAX_NAME_LENGTH);

export const newId = (): string =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
