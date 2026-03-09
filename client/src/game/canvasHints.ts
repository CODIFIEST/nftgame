import type * as Phaser from "phaser";

/** Type definition for canvas pool shape. */
type CanvasPoolShape = {
    create2D?: (parent?: unknown, width?: number, height?: number) => HTMLCanvasElement;
    __readbackHintPatched?: boolean;
};

/** Applies will read frequently hint. */
export function applyWillReadFrequentlyHint(PhaserLib: typeof Phaser): void {
    const canvasPool = (PhaserLib as unknown as { Display?: { Canvas?: { CanvasPool?: CanvasPoolShape } } })
        ?.Display?.Canvas?.CanvasPool;
    if (!canvasPool || typeof canvasPool.create2D !== "function" || canvasPool.__readbackHintPatched) {
        return;
    }

    const create2D = canvasPool.create2D.bind(canvasPool);
    canvasPool.create2D = (parent?: unknown, width?: number, height?: number): HTMLCanvasElement => {
        const canvas = create2D(parent, width, height);
        try {
            // Hint Chrome for repeated getImageData/readback operations (Phaser Text internals).
            canvas.getContext("2d", { willReadFrequently: true });
        } catch {
            // No-op: keep default context behavior on engines that do not support this hint.
        }
        return canvas;
    };
    canvasPool.__readbackHintPatched = true;
}
