import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

const Card = ({ className, ...props }: CardProps) => (
	<div
		className={cn(
			"rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200",
			className,
		)}
		{...props}
	/>
);

export default Card;
