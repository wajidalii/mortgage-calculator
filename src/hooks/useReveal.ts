import { type RefObject, useLayoutEffect, useState } from "react";

export type RevealState = "idle" | "pending" | "shown";

const prefersReducedMotion = (): boolean =>
	typeof window.matchMedia === "function" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Once-only scroll reveal. The element stays fully visible ("idle") unless
 * script confirms it starts below the fold and motion is allowed; only then
 * is it hidden ("pending") until it scrolls into view ("shown"). It never
 * hides again. Without IntersectionObserver, or with reduced motion, nothing
 * is ever hidden.
 */
export const useReveal = (ref: RefObject<Element | null>): RevealState => {
	const [state, setState] = useState<RevealState>("idle");
	useLayoutEffect(() => {
		const element = ref.current;
		if (
			!element ||
			typeof IntersectionObserver === "undefined" ||
			prefersReducedMotion()
		) {
			return;
		}
		// Already on screen at load: leave it alone rather than flash it.
		if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;
		setState("pending");
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				setState("shown");
				observer.disconnect();
			},
			{ rootMargin: "0px 0px -10% 0px" },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [ref]);
	return state;
};
