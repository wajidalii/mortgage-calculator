// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AdvancedSection from "./AdvancedSection";

afterEach(cleanup);

const details = () =>
	screen.getByText("Closing costs").closest("details") as HTMLDetailsElement;

const renderSection = (errorCount: number, defaultOpen = false) =>
	render(
		<AdvancedSection
			title="Closing costs"
			description="Fees and credits"
			errorCount={errorCount}
			defaultOpen={defaultOpen}
		>
			<p>Body</p>
		</AdvancedSection>,
	);

describe("AdvancedSection", () => {
	it("is a native disclosure that starts closed unless asked", () => {
		renderSection(0);
		expect(details().open).toBe(false);
		cleanup();
		renderSection(0, true);
		expect(details().open).toBe(true);
	});

	it("follows the user's toggle", () => {
		renderSection(0);
		details().open = true;
		fireEvent(details(), new Event("toggle"));
		expect(details().open).toBe(true);
	});

	it("shows the error count as text, not color alone", () => {
		renderSection(2, true);
		expect(screen.getByText("2 issues")).toBeTruthy();
		cleanup();
		renderSection(1, true);
		expect(screen.getByText("1 issue")).toBeTruthy();
	});

	it("opens when an error first appears while closed", () => {
		const { rerender } = renderSection(0);
		expect(details().open).toBe(false);
		rerender(
			<AdvancedSection
				title="Closing costs"
				description="Fees and credits"
				errorCount={1}
			>
				<p>Body</p>
			</AdvancedSection>,
		);
		expect(details().open).toBe(true);
		expect(screen.getByText("1 issue")).toBeTruthy();
	});
});
