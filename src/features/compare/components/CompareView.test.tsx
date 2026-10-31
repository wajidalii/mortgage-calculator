// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CompareView from "./CompareView";

afterEach(cleanup);

/** One whole loan column. Sections share it, so queries stay specific by text. */
const group = (loan: string, _section?: string) =>
	within(screen.getByRole("group", { name: loan }));
const summary = () =>
	within(screen.getByRole("region", { name: /differences at a glance/i }));

describe("CompareView", () => {
	it("shows both loans' payments, interest and monthly totals", () => {
		render(<CompareView />);
		expect(group("Loan A", "Monthly cost").getByText("$3,484.43")).toBeTruthy();
		expect(group("Loan B", "Monthly cost").getByText("$2,528.27")).toBeTruthy();
		expect(
			group("Loan A", "Over the life of the loan").getByText("$227,197.24"),
		).toBeTruthy();
		expect(
			group("Loan B", "Over the life of the loan").getByText("$510,179.81"),
		).toBeTruthy();
		expect(
			group("Loan A", "Monthly cost").getByText("Total monthly cost"),
		).toBeTruthy();
		// Down payment and cash to close are the same amount here.
		expect(group("Loan A", "Upfront").getAllByText("$100,000.00")).toHaveLength(
			2,
		);
	});

	it("marks the lower value without calling either loan better", () => {
		render(<CompareView />);
		expect(group("Loan B").getAllByText("Lower").length).toBeGreaterThan(0);
		expect(screen.queryByText(/better|best|winner/i)).toBeNull();
		expect(summary().getAllByText(/Loan B is .* lower/).length).toBeGreaterThan(
			0,
		);
		expect(summary().getByText(/Loan A is .* lower/)).toBeTruthy();
	});

	it("keeps each loan independent when one is edited", () => {
		render(<CompareView />);
		const a = group("Loan A", "Home").getByLabelText("Home price");
		const b = group("Loan B", "Home").getByLabelText("Home price");
		fireEvent.change(b, { target: { value: "600,000" } });
		expect((a as HTMLInputElement).value).toBe("500,000");
		expect((b as HTMLInputElement).value).toBe("600,000");
		expect(group("Loan A", "Monthly cost").getByText("$3,484.43")).toBeTruthy();
		expect(group("Loan B", "Monthly cost").getByText("$3,033.93")).toBeTruthy();
		expect(screen.getByText(/Home prices differ/)).toBeTruthy();
	});

	it("labels an ARM loan as a hypothetical rate and warns it is not equivalent", () => {
		render(<CompareView />);
		fireEvent.click(group("Loan B", "Loan").getByLabelText("5/6 ARM"));
		expect(
			group("Loan B").getAllByText("Hypothetical rate").length,
		).toBeGreaterThan(0);
		expect(group("Loan A").queryByText("Hypothetical rate")).toBeNull();
		expect(screen.getByText(/not equivalent/i)).toBeTruthy();
		expect(
			group("Loan B", "Rate").getByText("Index path after month 60"),
		).toBeTruthy();
	});

	it("swaps the two loans", () => {
		render(<CompareView />);
		fireEvent.click(screen.getByRole("button", { name: /swap loans/i }));
		expect(group("Loan A", "Monthly cost").getByText("$2,528.27")).toBeTruthy();
		expect(group("Loan B", "Monthly cost").getByText("$3,484.43")).toBeTruthy();
		expect(screen.getByRole("status").textContent).toMatch(/swapped/i);
	});

	it("copies Loan A into Loan B", () => {
		render(<CompareView />);
		fireEvent.click(
			screen.getByRole("button", { name: /copy loan a to loan b/i }),
		);
		expect(group("Loan B", "Monthly cost").getByText("$3,484.43")).toBeTruthy();
		expect(summary().getAllByText("Same for both").length).toBeGreaterThan(0);
	});

	it("shows one loan's field error without touching the other", () => {
		render(<CompareView />);
		const rate = group("Loan B", "Rate").getByLabelText("Interest rate");
		fireEvent.change(rate, { target: { value: "abc" } });
		fireEvent.blur(rate);
		expect(group("Loan B", "Rate").getByRole("alert")).toBeTruthy();
		expect(group("Loan A", "Rate").queryByRole("alert")).toBeNull();
		expect(
			group("Loan B").getAllByText(/fix the highlighted fields/i).length,
		).toBeGreaterThan(0);
		expect(group("Loan A", "Monthly cost").getByText("$3,484.43")).toBeTruthy();
	});

	it("keeps both loans' values when the mobile switch changes loan", () => {
		render(<CompareView />);
		const toggle = screen.getByRole("group", { name: "Show loan" });
		const b = within(toggle).getByRole("button", { name: /loan b/i });
		expect(b.getAttribute("aria-pressed")).toBe("false");
		fireEvent.change(group("Loan A", "Home").getByLabelText("Home price"), {
			target: { value: "450,000" },
		});
		fireEvent.click(b);
		expect(b.getAttribute("aria-pressed")).toBe("true");
		fireEvent.click(within(toggle).getByRole("button", { name: /loan a/i }));
		expect(
			(group("Loan A", "Home").getByLabelText("Home price") as HTMLInputElement)
				.value,
		).toBe("450,000");
	});

	it("shows the disclaimer", () => {
		render(<CompareView />);
		expect(screen.getByRole("note", { name: "Disclaimer" })).toBeTruthy();
	});
});
