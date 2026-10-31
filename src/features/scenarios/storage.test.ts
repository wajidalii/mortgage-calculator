import { describe, expect, it } from "vitest";
import { initialCalculatorState } from "@/features/calculator/calculatorReducer";
import { initialCompareState } from "@/features/compare/compare";
import {
	loadScenarios,
	type SavedScenario,
	SCHEMA_VERSION,
	STORAGE_KEY,
	type StorageLike,
	writeScenarios,
} from "./storage";
import { parseCalculatorInputs, parseCompareState } from "./validate";

const memory = (
	initial?: string,
): StorageLike & { raw: () => string | null } => {
	let value: string | null = initial ?? null;
	return {
		getItem: () => value,
		setItem: (_key, next) => {
			value = next;
		},
		raw: () => value,
	};
};

const scenario = (
	data: unknown,
	kind: SavedScenario["kind"] = "calculator",
): SavedScenario => ({
	id: "a",
	name: "House",
	kind,
	savedAt: "2026-10-31T00:00:00.000Z",
	data,
});

describe("storage round trip", () => {
	it("writes a versioned envelope and reads it back unchanged", () => {
		const store = memory();
		const saved = scenario(initialCalculatorState.inputs);
		expect(writeScenarios(store, [saved])).toBe(true);
		expect(JSON.parse(store.raw() ?? "").version).toBe(SCHEMA_VERSION);
		expect(loadScenarios(store)).toEqual({ ok: true, scenarios: [saved] });
	});

	it("restores calculator inputs and comparison state exactly", () => {
		const store = memory();
		writeScenarios(store, [
			scenario(initialCalculatorState.inputs),
			scenario(initialCompareState, "compare"),
		]);
		const result = loadScenarios(store);
		if (!result.ok) throw new Error("should load");
		expect(parseCalculatorInputs(result.scenarios[0]?.data)).toEqual(
			initialCalculatorState.inputs,
		);
		expect(parseCompareState(result.scenarios[1]?.data)).toEqual(
			initialCompareState,
		);
	});
});

describe("schema versions", () => {
	it("treats empty storage as an empty list", () => {
		expect(loadScenarios(memory())).toEqual({ ok: true, scenarios: [] });
	});

	it("treats corrupt or unversioned data as an empty list", () => {
		for (const raw of ["not json", "[]", '{"scenarios":[]}', "42"]) {
			expect(loadScenarios(memory(raw))).toEqual({ ok: true, scenarios: [] });
		}
	});

	it("leaves data from a newer version alone", () => {
		const raw = JSON.stringify({ version: SCHEMA_VERSION + 1, scenarios: [] });
		expect(loadScenarios(memory(raw))).toEqual({
			ok: false,
			reason: "newer-version",
		});
	});

	it("drops entries that are not scenarios", () => {
		const raw = JSON.stringify({
			version: 1,
			scenarios: [scenario(1), { id: 1 }, null],
		});
		const result = loadScenarios(memory(raw));
		expect(result.ok && result.scenarios).toHaveLength(1);
	});
});

describe("unavailable storage", () => {
	const throwing: StorageLike = {
		getItem: () => {
			throw new Error("blocked");
		},
		setItem: () => {
			throw new Error("blocked");
		},
	};

	it("reports unavailable instead of throwing", () => {
		expect(loadScenarios(null)).toEqual({ ok: false, reason: "unavailable" });
		expect(loadScenarios(throwing)).toEqual({
			ok: false,
			reason: "unavailable",
		});
		expect(writeScenarios(throwing, [])).toBe(false);
		expect(writeScenarios(null, [])).toBe(false);
	});

	it("uses one storage key", () => {
		expect(STORAGE_KEY).toBe("mortgage-calculator:scenarios");
	});
});

describe("parsing saved inputs", () => {
	it("rejects missing fields, wrong types and unknown choices", () => {
		const { homePrice, ...missing } = initialCalculatorState.inputs;
		expect(homePrice).toBeDefined();
		expect(parseCalculatorInputs(missing)).toBeNull();
		expect(
			parseCalculatorInputs({ ...initialCalculatorState.inputs, homePrice: 5 }),
		).toBeNull();
		expect(
			parseCalculatorInputs({ ...initialCalculatorState.inputs, state: "ZZ" }),
		).toBeNull();
		expect(
			parseCalculatorInputs({
				...initialCalculatorState.inputs,
				termYears: 10,
			}),
		).toBeNull();
		expect(parseCalculatorInputs(null)).toBeNull();
		expect(parseCompareState({ shared: {}, scenarios: [] })).toBeNull();
	});
});
