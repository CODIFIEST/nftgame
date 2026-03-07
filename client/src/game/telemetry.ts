type TelemetryPayload = Record<string, unknown>;

export function trackInfo(event: string, payload: TelemetryPayload = {}): void {
    console.log(`[Telemetry] ${event}`, payload);
}

export function trackWarn(event: string, payload: TelemetryPayload = {}): void {
    console.warn(`[Telemetry] ${event}`, payload);
}

export function trackError(event: string, payload: TelemetryPayload = {}): void {
    console.error(`[Telemetry] ${event}`, payload);
}

