import { useEffect, useRef, useState } from "react";

/**
 * Counts how many times `value` has changed while `enabled`. Use the count
 * as a React `key` (and show the highlight only when it is above zero) so a
 * short CSS highlight replays for a meaningful result change. Pass
 * `enabled: false` for a stale figure: it must not look newly calculated.
 * The first value never counts.
 */
export const useValueFlash = (value: unknown, enabled: boolean): number => {
	const [count, setCount] = useState(0);
	const previous = useRef(value);
	useEffect(() => {
		if (Object.is(previous.current, value)) return;
		previous.current = value;
		if (enabled) setCount((current) => current + 1);
	}, [value, enabled]);
	return count;
};
