import { STATE_NAMES } from "@/config/defaults/stateTaxTable";
import { DISCLAIMER_TEXT } from "@/config/disclaimer";
import { lifetimeInterest, summarizeByYear } from "@/lib/amortization";
import { formatMoney } from "@/lib/money";
import { formatPercent, formatRate } from "@/lib/rate";
import type { AssumptionItem } from "../assumptions";
import type { ResultSet } from "../hooks/useCalculatorInputs";
import type { CalculatorInputs } from "../types";

interface PrintReportProps {
	inputs: CalculatorInputs;
	results: ResultSet;
	/** Report date. Injectable so tests are stable. */
	date: Date;
}

const Heading = ({ children }: { children: string }) => (
	<h2 className="mt-6 border-b border-slate-400 pb-1 text-base font-semibold">
		{children}
	</h2>
);

const Pair = ({ label, value }: { label: string; value: string }) => (
	<div className="flex justify-between gap-4 py-0.5">
		<dt>{label}</dt>
		<dd className="font-medium">{value}</dd>
	</div>
);

const AssumptionRow = ({ item }: { item: AssumptionItem }) => (
	<li className="break-inside-avoid py-1.5">
		<div className="flex justify-between gap-4">
			<span className="font-medium">{item.label}</span>
			<span>{item.value}</span>
		</div>
		<div className="text-xs">
			{item.status}
			{item.asOf ? ` · As of ${item.asOf}` : ""}
			{item.confidence ? ` · Confidence: ${item.confidence}` : ""}
			{item.stale ? " · May be out of date" : ""}
			{item.source ? ` · Source: ${item.source}` : ""}
		</div>
	</li>
);

/**
 * The printed report (S-19). It is mounted only while printing, and it is a
 * table so the disclaimer sits in a footer group, which the browser repeats on
 * every printed page (AR-3).
 */
const PrintReport = ({ inputs, results, date }: PrintReportProps) => {
	const { loan, estimate, schedule, extra, arm, assumptions } = results;
	const rows = extra?.rows ?? schedule;
	const isArm = inputs.loanType === "arm";

	return (
		<table aria-label="Printable report" className="w-full text-sm text-black">
			<tbody>
				<tr>
					<td>
						<h1 className="text-2xl font-bold">Mortgage estimate report</h1>
						<p className="text-xs">
							Prepared {date.toISOString().slice(0, 10)}
						</p>

						{loan && estimate ? (
							<>
								<Heading>Inputs</Heading>
								<dl>
									<Pair
										label="Home price"
										value={formatMoney(loan.homePrice)}
									/>
									<Pair
										label="Down payment"
										value={`${formatMoney(loan.downPayment)} (${formatPercent(loan.downPaymentPercent, 2)})`}
									/>
									<Pair
										label="Loan amount"
										value={formatMoney(loan.loanAmount)}
									/>
									<Pair
										label="Loan-to-value"
										value={formatPercent(loan.ltv, 2)}
									/>
									<Pair
										label="Loan type"
										value={isArm ? "5/6 ARM" : "Fixed rate"}
									/>
									<Pair
										label={isArm ? "Start rate" : "Interest rate"}
										value={formatRate(loan.interestRate)}
									/>
									<Pair label="Loan term" value={`${loan.termYears} years`} />
									<Pair label="State" value={STATE_NAMES[inputs.state]} />
								</dl>

								<Heading>Itemized monthly estimate</Heading>
								<dl>
									{estimate.lender.map((line) => (
										<Pair
											key={line.id}
											label={line.label}
											value={formatMoney(line.amount)}
										/>
									))}
									<Pair
										label="Lender payment (escrow)"
										value={formatMoney(estimate.lenderPayment)}
									/>
									{estimate.nonEscrow.map((line) => (
										<Pair
											key={line.id}
											label={line.label}
											value={formatMoney(line.amount)}
										/>
									))}
									<Pair
										label="Non-escrow total"
										value={formatMoney(estimate.nonEscrowTotal)}
									/>
									<Pair
										label="Total per month"
										value={formatMoney(estimate.total)}
									/>
								</dl>
								{arm ? (
									<p className="mt-2 text-xs">
										Principal and interest is for months 1 to 60. After that the
										rate resets; payments up to{" "}
										{formatMoney(arm.summary.peakPayment)} a month use a
										hypothetical rate from an assumed index path.
									</p>
								) : null}

								{rows ? (
									<>
										<Heading>Schedule summary</Heading>
										<dl>
											<Pair
												label="Number of payments"
												value={String(rows.length)}
											/>
											<Pair
												label="Lifetime interest"
												value={formatMoney(lifetimeInterest(rows))}
											/>
											{extra ? (
												<Pair
													label="Interest saved by extra payments"
													value={formatMoney(extra.interestSaved)}
												/>
											) : null}
										</dl>
										<table className="mt-2 w-full text-xs">
											<caption className="sr-only">
												Yearly schedule summary
											</caption>
											<thead>
												<tr className="border-b border-slate-400 text-right">
													<th scope="col" className="py-1 text-left">
														Year
													</th>
													<th scope="col">Payments</th>
													<th scope="col">Principal</th>
													<th scope="col">Interest</th>
													<th scope="col">Balance</th>
												</tr>
											</thead>
											<tbody>
												{summarizeByYear(rows).map((row) => (
													<tr
														key={row.year}
														className="break-inside-avoid text-right"
													>
														<th
															scope="row"
															className="py-0.5 text-left font-normal"
														>
															{row.year}
														</th>
														<td>{formatMoney(row.payment)}</td>
														<td>
															{formatMoney(
																(row.principal +
																	row.extra) as typeof row.principal,
															)}
														</td>
														<td>{formatMoney(row.interest)}</td>
														<td>{formatMoney(row.balance)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</>
								) : null}
							</>
						) : (
							<p className="mt-4">
								The inputs are not complete, so there is no estimate to print.
								Fix the highlighted fields and print again.
							</p>
						)}

						<Heading>Assumptions and defaults</Heading>
						{assumptions.length > 0 ? (
							<>
								<p className="mt-1 text-xs">
									"Entered" values are the client's. "Illustrative" values are
									defaults, shown with the date they were set. "Overridden"
									values are defaults that were replaced.
								</p>
								<ul className="divide-y divide-slate-300">
									{assumptions.map((item) => (
										<AssumptionRow key={item.id} item={item} />
									))}
								</ul>
							</>
						) : (
							<p className="mt-1">
								No assumptions are listed for incomplete inputs.
							</p>
						)}
					</td>
				</tr>
			</tbody>
			<tfoot>
				<tr>
					<td className="border-t border-slate-400 pt-2 text-xs">
						<strong>Disclaimer.</strong> {DISCLAIMER_TEXT}
					</td>
				</tr>
			</tfoot>
		</table>
	);
};

export default PrintReport;
