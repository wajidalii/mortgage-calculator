export interface Env {
	apiBaseUrl: string;
	appName: string;
}

const required = (key: keyof ImportMetaEnv): string => {
	const value = import.meta.env[key];
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
};

export const env: Env = Object.freeze({
	apiBaseUrl: required("VITE_API_BASE_URL").replace(/\/+$/, ""),
	appName: required("VITE_APP_NAME"),
});
