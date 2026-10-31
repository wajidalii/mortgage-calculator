const PATHS = {
	home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5",
	scale:
		"M12 4v16M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7Zm14 0-2.5 6a3 3 0 0 0 5 0L19 7Z",
	refresh: "M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4",
	check: "m5 12.5 4.5 4.5L19 7.5",
	arrow: "M5 12h14m-6-6 6 6-6 6",
	lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
	print: "M7 9V4h10v5M7 17H5v-6h14v6h-2M7 14h10v6H7z",
	bookmark: "M7 4h10v16l-5-3.5L7 20z",
	user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
	key: "M14.5 9.5a4 4 0 1 1-1.2 2.8L4 21v-3h3v-3h3l2.3-2.3",
	briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
	name: IconName;
	className?: string;
}

const Icon = ({ name, className = "size-5" }: IconProps) => (
	<svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.75"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d={PATHS[name]} />
	</svg>
);

export default Icon;
