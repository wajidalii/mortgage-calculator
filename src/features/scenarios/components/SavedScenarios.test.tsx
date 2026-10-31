// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoanCalculator from "@/features/calculator/components/LoanCalculator";
import type { StorageLike } from "../storage";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

const memory = (): StorageLike => {
	let value: string | null = null;
	return {
		getItem: () => value,
		setItem: (_key, next) => {
			value = next;
		},
	};
};

const throwing: StorageLike = {
	getItem: () => {
		throw new Error("blocked");
	},
	setItem: () => {
		throw new Error("blocked");
	},
};

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const type = (name: string, value: string) => {
	fireEvent.change(field(name), { target: { value } });
	fireEvent.blur(field(name));
};
const saved = () =>
	within(screen.getByRole("region", { name: "Saved scenarios" }));

const save = (name: string) => {
	fireEvent.change(field("Scenario name"), { target: { value: name } });
	fireEvent.click(saved().getByRole("button", { name: "Save" }));
};

describe("saved scenarios", () => {
	it("saves, survives a reload and reopens with identical inputs", () => {
		const store = memory();
		const first = render(<LoanCalculator storage={store} />);
		type("Home price", "650,000");
		type("Interest rate", "5.75");
		save("Condo");
		expect(saved().getByText("Condo")).toBeTruthy();
		first.unmount();

		// A reload: a new calculator reading the same storage.
		render(<LoanCalculator storage={store} />);
		expect(saved().getByText("Condo")).toBeTruthy();
		expect(field("Home price").value).toBe("500,000");
		fireEvent.click(saved().getByRole("button", { name: "Open Condo" }));
		expect(field("Home price").value).toBe("650,000");
		expect(field("Interest rate").value).toBe("5.75");
	});

	it("shows a not-available message when storage is blocked and keeps working", () => {
		render(<LoanCalculator storage={throwing} />);
		expect(saved().getByText(/Saving is not available/)).toBeTruthy();
		save("Anything");
		expect(saved().getByText(/Saving is not available/)).toBeTruthy();
		type("Home price", "600,000");
		expect(screen.getByText("$480,000.00")).toBeTruthy();
	});

	it("shows the message when a write is refused", () => {
		const full: StorageLike = {
			getItem: () => null,
			setItem: () => {
				throw new Error("quota");
			},
		};
		render(<LoanCalculator storage={full} />);
		save("Big");
		expect(saved().getByText(/Saving is not available/)).toBeTruthy();
		expect(saved().queryByText("Big")).toBeNull();
	});

	it("asks before deleting and removes the scenario on confirm", () => {
		render(<LoanCalculator storage={memory()} />);
		save("Temp");
		fireEvent.click(saved().getByRole("button", { name: "Delete Temp" }));
		fireEvent.click(saved().getByRole("button", { name: "Cancel" }));
		expect(saved().getByText("Temp")).toBeTruthy();
		fireEvent.click(saved().getByRole("button", { name: "Delete Temp" }));
		fireEvent.click(saved().getByRole("button", { name: "Confirm delete" }));
		expect(saved().queryByText("Temp")).toBeNull();
	});

	it("needs a name", () => {
		render(<LoanCalculator storage={memory()} />);
		save("   ");
		expect(saved().getByText("Enter a name for the scenario.")).toBeTruthy();
	});

	it("makes no network request when saving or opening", () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);
		render(<LoanCalculator storage={memory()} />);
		save("Local");
		fireEvent.click(saved().getByRole("button", { name: "Open Local" }));
		expect(fetchSpy).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});
});
