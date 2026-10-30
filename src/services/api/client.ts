import { env } from "@/config/env";

export interface RequestOptions extends Omit<RequestInit, "body"> {
	body?: unknown;
}

export class ApiError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

export const apiRequest = async <T>(
	path: string,
	{ body, headers, ...init }: RequestOptions = {},
): Promise<T> => {
	const response = await fetch(
		`${env.apiBaseUrl}/${path.replace(/^\/+/, "")}`,
		{
			...init,
			headers: {
				Accept: "application/json",
				...(body === undefined ? {} : { "Content-Type": "application/json" }),
				...headers,
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		},
	);

	if (!response.ok) {
		throw new ApiError(response.status, response.statusText);
	}
	if (response.status === 204) {
		return undefined as T;
	}
	return (await response.json()) as T;
};
