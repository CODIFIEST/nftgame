let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (audioContext) {
        return audioContext;
    }
    if (typeof window === "undefined") {
        return null;
    }

    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
        return null;
    }

    audioContext = new AudioCtx();
    return audioContext;
}

export function playTone(
    frequency: number,
    durationMs: number,
    gain = 0.03,
    type: OscillatorType = "sine",
): void {
    const ctx = getAudioContext();
    if (!ctx) {
        return;
    }

    if (ctx.state === "suspended") {
        void ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gain;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000);
}

export async function disposeAudio(): Promise<void> {
    if (!audioContext) {
        return;
    }
    try {
        await audioContext.close();
    } catch {
        // Closing can fail in some browsers if context already closed.
    } finally {
        audioContext = null;
    }
}
