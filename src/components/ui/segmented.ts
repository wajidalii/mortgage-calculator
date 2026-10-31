/**
 * Shared classes for segmented controls. A segment is a visually hidden radio
 * (`peer sr-only`) followed by this span, so the group stays a real radio
 * group for keyboards and screen readers.
 */
export const SEGMENT_GROUP = "mt-1.5 grid gap-1 rounded-xl bg-slate-100 p-1";

export const SEGMENT_OPTION =
	"flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-semibold text-slate-600 motion-safe:transition-[color,background-color,box-shadow] motion-safe:duration-micro hover:text-slate-900 active:bg-white/60 peer-checked:bg-white peer-checked:text-brand-700 peer-checked:shadow-sm peer-checked:ring-1 peer-checked:ring-slate-200 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500";

/** For `aria-pressed` toggle buttons that sit in a SEGMENT_GROUP-like row. */
export const TOGGLE_GROUP = "inline-flex gap-1 rounded-lg bg-slate-100 p-1";

export const toggleOption = (pressed: boolean): string =>
	[
		"min-h-11 rounded-md px-3 py-1 text-sm font-semibold motion-safe:transition-[color,background-color,box-shadow] motion-safe:duration-micro active:bg-white/60",
		pressed
			? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200"
			: "text-slate-600 hover:text-slate-900",
	].join(" ");
