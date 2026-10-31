/** Static class names per loan, so Tailwind can see them. A is teal, B is indigo. */
export const LOAN_LABELS = ["Loan A", "Loan B"] as const;

export const LOAN_STYLE = [
	{
		badge: "bg-brand-600 text-white",
		accent: "border-t-brand-600",
		soft: "bg-brand-50 text-brand-800 ring-brand-100",
		active: "bg-brand-600 text-white shadow-sm",
	},
	{
		badge: "bg-indigo-700 text-white",
		accent: "border-t-indigo-700",
		soft: "bg-indigo-50 text-indigo-900 ring-indigo-100",
		active: "bg-indigo-700 text-white shadow-sm",
	},
] as const;
