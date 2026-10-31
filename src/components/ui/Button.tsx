import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { type ButtonVariant, buttonClasses } from "./buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Extract<ButtonVariant, "primary" | "secondary">;
}

const Button = ({
	variant = "primary",
	className,
	type = "button",
	...props
}: ButtonProps) => (
	<button
		type={type}
		className={cn(buttonClasses(variant), className)}
		{...props}
	/>
);

export default Button;
