import { type RefObject, useEffect, useState } from "react";

/**
 * True while the element, plus `margin` pixels, is no taller than the
 * viewport. A sticky panel taller than the viewport would hide its own bottom
 * edge, so callers make it sticky only while this is true. Without
 * ResizeObserver (old browsers, jsdom) it stays false: no stickiness.
 */
export const useFitsViewport = (
	ref: RefObject<HTMLElement | null>,
	margin = 0,
): boolean => {
	const [fits, setFits] = useState(false);
	useEffect(() => {
		const element = ref.current;
		if (!element || typeof ResizeObserver === "undefined") return;
		const check = () =>
			setFits(element.offsetHeight + margin <= window.innerHeight);
		const observer = new ResizeObserver(check);
		observer.observe(element);
		window.addEventListener("resize", check);
		check();
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", check);
		};
	}, [ref, margin]);
	return fits;
};
