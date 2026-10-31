export type ButtonVariant =
	| "primary"
	| "secondary"
	| "onDark"
	| "outlineOnDark";
export type ButtonSize = "md" | "lg";

const BASE =
	"group inline-flex items-center justify-center gap-2 rounded-lg font-semibold motion-safe:transition-[background-color,box-shadow,transform] motion-safe:duration-hover motion-safe:ease-standard motion-safe:active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
	primary:
		"bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md active:bg-brand-800 focus-visible:outline-brand-500",
	secondary:
		"bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 hover:ring-slate-400 active:bg-slate-100 focus-visible:outline-brand-500",
	// For dark brand surfaces: white fill, and a white outline ring.
	onDark:
		"bg-white text-brand-900 hover:bg-brand-50 hover:shadow-lg active:bg-brand-100 focus-visible:outline-white",
	outlineOnDark:
		"text-white ring-1 ring-white/50 hover:bg-white/10 hover:ring-white active:bg-white/20 focus-visible:outline-white",
};

const SIZES: Record<ButtonSize, string> = {
	md: "px-4 py-2 text-sm",
	lg: "min-h-12 px-6 py-3 text-base",
};

/** Shared by `Button` and `ButtonLink` so a link can look like a button. */
export const buttonClasses = (
	variant: ButtonVariant = "primary",
	size: ButtonSize = "md",
): string => `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
