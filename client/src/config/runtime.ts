const DEFAULT_API_BASE_URL = "https://nftgame-server.vercel.app";

/** Normalizes URL-like values by trimming and removing trailing slashes. */
function cleanUrl(value?: string): string {
    return (value ?? "").trim().replace(/\/+$/, "");
}

/** Returns the API base URL from env, or the production fallback. */
export function getApiBaseUrl(): string {
    const envValue = cleanUrl(import.meta.env.VITE_API_BASE_URL);
    return envValue || DEFAULT_API_BASE_URL;
}

/** Logs startup configuration problems that would break API calls. */
export function assertGameRuntimeConfig(): void {
    const apiBase = getApiBaseUrl();
    if (!apiBase) {
        console.error("[Config] Missing API base URL. Set VITE_API_BASE_URL.");
    }
}
