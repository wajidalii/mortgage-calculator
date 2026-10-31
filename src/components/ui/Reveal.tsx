import { type ReactNode, useRef } from "react";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/cn";

interface RevealProps {
	children: ReactNode;
	className?: string;
	/** Milliseconds to wait once revealed, to stagger siblings. */
	delay?: number;
}

/** Fades and lifts its children in the first time they scroll into view. */
const Reveal = ({ children, className, delay = 0 }: RevealProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const state = useReveal(ref);
	return (
		<div
			ref={ref}
			className={cn(
				state === "pending" && "reveal-pending",
				state === "shown" && "reveal-shown",
				className,
			)}
			style={
				state === "shown" && delay
					? { transitionDelay: `${delay}ms` }
					: undefined
			}
		>
			{children}
		</div>
	);
};

export default Reveal;
