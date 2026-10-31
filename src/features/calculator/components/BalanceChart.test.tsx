// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildSchedule } from "@/lib/amortization";
import { formatMoney } from "@/lib/money";
import type { Cents, Micros } from "@/types/units";
import BalanceChart from "./BalanceChart";

afterEach(cleanup);

const loan = 20_000_000 as Cents;
const rows = buildSchedule({ loan, rate: 65_000 as Micros, payments: 120 });

const renderChart = () =>
	render(<BalanceChart rows={rows} loanAmount={loan} />);

describe("BalanceChart year explorer", () => {
	it("offers a labelled slider covering every loan year", () => {
		renderChart();
		const slider = screen.getByRole("slider", {
			name: /explore the balance by year/i,
		}) as HTMLInputElement;
		expect(slider.min).toBe("0");
		expect(slider.max).toBe("10");
	});

	it("reads out the exact ledger balance for the chosen year", () => {
		renderChart();
		const slider = screen.getByRole("slider");
		fireEvent.change(slider, { target: { value: "5" } });
		const yearFive = rows[59]?.balance as Cents;
		expect(
			screen.getByText(`Year 5: balance ${formatMoney(yearFive)}`),
		).toBeTruthy();
		expect(slider.getAttribute("aria-valuetext")).toContain(
			formatMoney(yearFive),
		);
	});

	it("reports zero at the end of the loan", () => {
		renderChart();
		fireEvent.change(screen.getByRole("slider"), { target: { value: "10" } });
		expect(screen.getByText("Year 10: balance $0.00")).toBeTruthy();
	});

	it("still states the key facts in text", () => {
		renderChart();
		expect(screen.getByText(/paid off in year 10/i)).toBeTruthy();
	});
});
