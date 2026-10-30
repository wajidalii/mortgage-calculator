import type { ReactNode } from "react";

interface ProvidersProps {
	children: ReactNode;
}

// Add stable, low-frequency global providers here.
const Providers = ({ children }: ProvidersProps) => <>{children}</>;

export default Providers;
