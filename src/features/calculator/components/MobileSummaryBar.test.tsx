// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Cents } from "@/types/units";
import MobileSummaryBar from "./MobileSummaryBar";

afterEach(cleanup);

describe("MobileSummaryBar", () => {
	it("shows the total and links to the results", () => {
		render(
			<MobileSummaryBar
				total={356_160 as Cents}
				stale={false}
				targetId="results"
				hidden={false}
			/>,
		);
		expect(screen.getByText("$3,561.60")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "See breakdown" }).getAttribute("href"),
		).toBe("#results");
		expect(screen.queryByText(/Last valid entry/)).toBeNull();
	});

	it("marks a held result as the last valid entry", () => {
		render(
			<MobileSummaryBar
				total={356_160 as Cents}
				stale
				targetId="results"
				hidden={false}
			/>,
		);
		expect(screen.getByText(/Last valid entry/)).toBeTruthy();
	});

	it("asks to check inputs when there is no total, and hides on request", () => {
		const { rerender } = render(
			<MobileSummaryBar
				total={null}
				stale={false}
				targetId="results"
				hidden={false}
			/>,
		);
		expect(screen.getByText("Check your inputs")).toBeTruthy();
		rerender(
			<MobileSummaryBar total={null} stale={false} targetId="results" hidden />,
		);
		expect(screen.queryByTestId("mobile-summary")).toBeNull();
	});
});
