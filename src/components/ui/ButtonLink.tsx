import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import {
	type ButtonSize,
	type ButtonVariant,
	buttonClasses,
} from "./buttonStyles";

interface ButtonLinkProps {
	to: string;
	children: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
}

/** A router link styled as a button, for calls to action that navigate. */
const ButtonLink = ({
	to,
	children,
	variant = "primary",
	size = "md",
	className,
}: ButtonLinkProps) => (
	<Link to={to} className={cn(buttonClasses(variant, size), className)}>
		{children}
	</Link>
);

export default ButtonLink;
