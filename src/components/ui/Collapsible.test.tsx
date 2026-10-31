// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Collapsible from "./Collapsible";

afterEach(cleanup);

const details = () =>
	screen.getByText("Closing costs").closest("details") as HTMLDetailsElement;

const field = <input aria-label="Lender fees" />;

describe("Collapsible", () => {
	it("is closed by default and follows the browser's toggle", () => {
		render(<Collapsible title="Closing costs">{field}</Collapsible>);
		expect(details().open).toBe(false);
		// jsdom does not open <details> on a summary click, so fire the toggle.
		details().open = true;
		fireEvent(details(), new Event("toggle"));
		expect(details().open).toBe(true);
	});

	it("can start open", () => {
		render(
			<Collapsible title="Closing costs" defaultOpen>
				{field}
			</Collapsible>,
		);
		expect(details().open).toBe(true);
		expect(screen.queryByText(/Needs attention/)).toBeNull();
	});

	it("opens itself and says why when a field inside has an error", () => {
		const { rerender } = render(
			<Collapsible title="Closing costs">{field}</Collapsible>,
		);
		expect(details().open).toBe(false);
		rerender(
			<Collapsible title="Closing costs" invalid>
				{field}
			</Collapsible>,
		);
		expect(details().open).toBe(true);
		expect(screen.getByText(/Needs attention/)).toBeTruthy();
	});
});
