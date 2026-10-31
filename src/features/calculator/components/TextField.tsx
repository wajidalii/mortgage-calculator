import { useId } from "react";
import { cn } from "@/lib/cn";

interface TextFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	onBlur: () => void;
	error?: string | undefined;
	hint?: string;
	prefix?: string;
	suffix?: string;
	readOnly?: boolean;
	className?: string;
}

const TextField = ({
	label,
	value,
	onChange,
	onBlur,
	error,
	hint,
	prefix,
	suffix,
	readOnly = false,
	className,
}: TextFieldProps) => {
	const id = useId();
	const errorId = `${id}-error`;
	const hintId = `${id}-hint`;
	const describedBy =
		[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
		undefined;

	return (
		<div className={className}>
			<label
				htmlFor={id}
				className="block text-sm font-semibold text-slate-800"
			>
				{label}
			</label>
			<div
				className={cn(
					"mt-1.5 flex min-h-12 items-center rounded-xl bg-white ring-1 ring-slate-300 motion-safe:transition-shadow motion-safe:duration-micro hover:ring-slate-400 focus-within:ring-3 focus-within:ring-brand-500",
					error &&
						"ring-2 ring-red-600 hover:ring-red-600 focus-within:ring-red-600",
					readOnly && "bg-slate-50 text-slate-600 hover:ring-slate-300",
				)}
			>
				{prefix ? (
					<span
						aria-hidden="true"
						className="pl-3.5 font-semibold text-slate-500"
					>
						{prefix}
					</span>
				) : null}
				<input
					id={id}
					type="text"
					inputMode="decimal"
					autoComplete="off"
					value={value}
					readOnly={readOnly}
					aria-readonly={readOnly || undefined}
					aria-invalid={error ? true : undefined}
					aria-describedby={describedBy}
					onChange={(event) => onChange(event.target.value)}
					onBlur={onBlur}
					className="w-full min-w-0 bg-transparent px-3 py-2 text-base font-semibold text-slate-900 tabular-nums outline-none"
				/>
				{suffix ? (
					<span
						aria-hidden="true"
						className="pr-3.5 font-semibold text-slate-500"
					>
						{suffix}
					</span>
				) : null}
			</div>
			{hint ? (
				<p
					id={hintId}
					className="mt-1.5 text-xs leading-relaxed text-slate-600"
				>
					{hint}
				</p>
			) : null}
			{error ? (
				<p
					id={errorId}
					role="alert"
					className="mt-1 text-sm font-medium text-red-700 motion-safe:animate-fade"
				>
					<span aria-hidden="true">⚠ </span>
					{error}
				</p>
			) : null}
		</div>
	);
};

export default TextField;
