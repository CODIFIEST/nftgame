/** Type definition for telemetry payload. */
type TelemetryPayload = Record<string, unknown>;

/** Tracks info telemetry. */
export function trackInfo(event: string, payload: TelemetryPayload = {}): void {
    console.log(`[Telemetry] ${event}`, payload);
}

/** Tracks warn telemetry. */
export function trackWarn(event: string, payload: TelemetryPayload = {}): void {
    console.warn(`[Telemetry] ${event}`, payload);
}

/** Tracks error telemetry. */
export function trackError(event: string, payload: TelemetryPayload = {}): void {
    console.error(`[Telemetry] ${event}`, payload);
}

