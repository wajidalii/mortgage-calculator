import { type RefObject, useEffect, useState } from "react";

/**
 * True while the element is at least partly on screen. Where
 * IntersectionObserver is missing (old browsers, jsdom) it stays false, so
 * anything shown "when out of view" falls back to always shown.
 */
export const useInView = (ref: RefObject<Element | null>): boolean => {
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const element = ref.current;
		if (!element || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(([entry]) => {
			setInView(entry?.isIntersecting ?? false);
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [ref]);
	return inView;
};
