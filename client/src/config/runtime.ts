const DEFAULT_API_BASE_URL = "https://nftgame-server.vercel.app";

function cleanUrl(value?: string): string {
    return (value ?? "").trim().replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
    const envValue = cleanUrl(import.meta.env.VITE_API_BASE_URL);
    return envValue || DEFAULT_API_BASE_URL;
}

export function assertGameRuntimeConfig(): void {
    const apiBase = getApiBaseUrl();
    if (!apiBase) {
        console.error("[Config] Missing API base URL. Set VITE_API_BASE_URL.");
    }
}

