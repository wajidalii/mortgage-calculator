import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

const Card = ({ className, ...props }: CardProps) => (
	<div
		className={cn(
			"rounded-2xl bg-white p-4 shadow-panel ring-1 ring-slate-200 sm:p-6",
			className,
		)}
		{...props}
	/>
);

export default Card;
