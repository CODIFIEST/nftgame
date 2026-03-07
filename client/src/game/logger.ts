type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVEL_KEY = "nftgame.logLevel";
const LEVEL_WEIGHT: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 50,
};

const sampleCounts = new Map<string, number>();

function currentLevel(): LogLevel {
    if (typeof window !== "undefined") {
        const fromStorage = window.localStorage?.getItem(LOG_LEVEL_KEY);
        if (
            fromStorage === "debug" ||
            fromStorage === "info" ||
            fromStorage === "warn" ||
            fromStorage === "error" ||
            fromStorage === "silent"
        ) {
            return fromStorage;
        }
    }
    return "info";
}

function shouldLog(level: LogLevel): boolean {
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[currentLevel()];
}

export function setLogLevel(level: LogLevel): void {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage?.setItem(LOG_LEVEL_KEY, level);
}

export function logDebug(message: string, payload?: unknown): void {
    if (!shouldLog("debug")) {
        return;
    }
    if (payload === undefined) {
        console.debug(message);
    } else {
        console.debug(message, payload);
    }
}

export function logInfo(message: string, payload?: unknown): void {
    if (!shouldLog("info")) {
        return;
    }
    if (payload === undefined) {
        console.info(message);
    } else {
        console.info(message, payload);
    }
}

export function logWarn(message: string, payload?: unknown): void {
    if (!shouldLog("warn")) {
        return;
    }
    if (payload === undefined) {
        console.warn(message);
    } else {
        console.warn(message, payload);
    }
}

export function logError(message: string, payload?: unknown): void {
    if (!shouldLog("error")) {
        return;
    }
    if (payload === undefined) {
        console.error(message);
    } else {
        console.error(message, payload);
    }
}

export function logInfoSampled(
    key: string,
    message: string,
    payload?: unknown,
    firstN = 3,
    everyN = 20,
): void {
    const next = (sampleCounts.get(key) ?? 0) + 1;
    sampleCounts.set(key, next);
    const shouldEmit = next <= firstN || (everyN > 0 && next % everyN === 0);
    if (!shouldEmit) {
        return;
    }
    logInfo(message, payload);
}
