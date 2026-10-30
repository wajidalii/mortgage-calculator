import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary";
}

const variants = {
	primary: "bg-brand-600 text-white hover:bg-brand-700",
	secondary: "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100",
} as const;

const Button = ({
	variant = "primary",
	className,
	type = "button",
	...props
}: ButtonProps) => (
	<button
		type={type}
		className={cn(
			"inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50",
			variants[variant],
			className,
		)}
		{...props}
	/>
);

export default Button;
