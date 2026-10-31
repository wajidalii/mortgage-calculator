import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

/**
 * True while the browser is printing. A report is mounted only then, so it
 * does not duplicate the page text on screen. `beforeprint` also fires for
 * Ctrl+P and the browser menu, not only a Print button; flushSync makes the
 * report render before the browser lays out the pages.
 */
export const usePrinting = (): boolean => {
	const [printing, setPrinting] = useState(false);
	useEffect(() => {
		const before = () => flushSync(() => setPrinting(true));
		const after = () => setPrinting(false);
		window.addEventListener("beforeprint", before);
		window.addEventListener("afterprint", after);
		return () => {
			window.removeEventListener("beforeprint", before);
			window.removeEventListener("afterprint", after);
		};
	}, []);
	return printing;
};
