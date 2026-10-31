// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useValueFlash } from "./useValueFlash";

describe("useValueFlash", () => {
	it("does not count the first value", () => {
		const { result } = renderHook(() => useValueFlash(100, true));
		expect(result.current).toBe(0);
	});

	it("counts each real change", () => {
		const { result, rerender } = renderHook(
			({ value }) => useValueFlash(value, true),
			{ initialProps: { value: 100 } },
		);
		rerender({ value: 100 });
		expect(result.current).toBe(0);
		rerender({ value: 120 });
		expect(result.current).toBe(1);
		rerender({ value: 90 });
		expect(result.current).toBe(2);
	});

	it("never counts a change while disabled, such as a stale estimate", () => {
		const { result, rerender } = renderHook(
			({ value, enabled }) => useValueFlash(value, enabled),
			{ initialProps: { value: 100, enabled: false } },
		);
		rerender({ value: 120, enabled: false });
		expect(result.current).toBe(0);
		rerender({ value: 120, enabled: true });
		expect(result.current).toBe(0);
	});
});
