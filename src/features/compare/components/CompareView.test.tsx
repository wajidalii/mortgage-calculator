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

const table = () => within(screen.getByRole("table"));
const column = (name: string) => within(screen.getByRole("group", { name }));

describe("CompareView", () => {
	it("shows the 15 and 30 year payments and lifetime interest", () => {
		render(<CompareView />);
		for (const text of [
			"$3,484.43",
			"$2,528.27",
			"$227,197.24",
			"$510,179.81",
		]) {
			expect(table().getByText(text)).toBeTruthy();
		}
		expect(table().queryByText("Hypothetical rate")).toBeNull();
	});

	it("labels the ARM column as a hypothetical rate", () => {
		render(<CompareView />);
		fireEvent.click(column("Loan B").getByLabelText("5/6 ARM"));
		expect(table().getAllByText("Hypothetical rate")).toHaveLength(1);
		expect(screen.getAllByText(/assumed/).length).toBeGreaterThan(0);
	});

	it("updates both columns when a shared input changes", () => {
		render(<CompareView />);
		fireEvent.change(screen.getByLabelText("Home price"), {
			target: { value: "600,000" },
		});
		expect(table().queryByText("$3,484.43")).toBeNull();
		expect(table().queryByText("$2,528.27")).toBeNull();
		expect(table().getByText("$4,181.32")).toBeTruthy();
		expect(table().getByText("$3,033.93")).toBeTruthy();
	});

	it("shows the disclaimer", () => {
		render(<CompareView />);
		expect(
			screen.getByRole("complementary", { name: "Disclaimer" }),
		).toBeTruthy();
	});
});
