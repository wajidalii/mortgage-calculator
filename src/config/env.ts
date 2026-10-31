export interface Env {
	apiBaseUrl: string;
	appName: string;
}

const withDefault = (key: keyof ImportMetaEnv, fallback: string): string => {
	const value = import.meta.env[key];
	return typeof value === "string" && value.trim() !== "" ? value : fallback;
};

export const env: Env = Object.freeze({
	apiBaseUrl: withDefault("VITE_API_BASE_URL", "/api").replace(/\/+$/, ""),
	appName: withDefault("VITE_APP_NAME", "Mortgage Calculator"),
});
