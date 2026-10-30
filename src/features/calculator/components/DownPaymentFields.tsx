import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { DownPaymentMode } from "../types";
import TextField from "./TextField";

interface DownPaymentFieldsProps {
	mode: DownPaymentMode;
	percent: string;
	amount: string;
	error?: string | undefined;
	onModeChange: (mode: DownPaymentMode) => void;
	onPercentChange: (value: string) => void;
	onAmountChange: (value: string) => void;
	onBlur: (field: "downPaymentPercent" | "downPaymentAmount") => void;
}

const MODES: { mode: DownPaymentMode; label: string }[] = [
	{ mode: "percent", label: "Percent" },
	{ mode: "amount", label: "Dollar amount" },
];

const DownPaymentFields = ({
	mode,
	percent,
	amount,
	error,
	onModeChange,
	onPercentChange,
	onAmountChange,
	onBlur,
}: DownPaymentFieldsProps) => (
	<fieldset className="sm:col-span-2">
		<div className="flex flex-wrap items-center justify-between gap-2">
			<legend className="text-sm font-medium text-slate-800">
				Down payment
			</legend>
			<fieldset>
				<legend className="sr-only">Enter down payment as</legend>
				{MODES.map((item) => (
					<Button
						key={item.mode}
						variant={mode === item.mode ? "primary" : "secondary"}
						aria-pressed={mode === item.mode}
						onClick={() => onModeChange(item.mode)}
						className={cn("px-3 py-1 first:rounded-r-none last:rounded-l-none")}
					>
						{item.label}
					</Button>
				))}
			</fieldset>
		</div>
		<div className="mt-1 grid gap-4 sm:grid-cols-2">
			<TextField
				label="Down payment (%)"
				suffix="%"
				value={percent}
				readOnly={mode !== "percent"}
				error={mode === "percent" ? error : undefined}
				hint={
					mode === "percent" ? undefined : "Calculated from the dollar amount"
				}
				onChange={onPercentChange}
				onBlur={() => onBlur("downPaymentPercent")}
			/>
			<TextField
				label="Down payment ($)"
				prefix="$"
				value={amount}
				readOnly={mode !== "amount"}
				error={mode === "amount" ? error : undefined}
				hint={mode === "amount" ? undefined : "Calculated from the percent"}
				onChange={onAmountChange}
				onBlur={() => onBlur("downPaymentAmount")}
			/>
		</div>
	</fieldset>
);

export default DownPaymentFields;
