/** Result shape returned by horizontal constraint. */
export type HorizontalConstraintResult = {
    x: number;
    velocityX: number;
};

/** Performs clamp to range. */
export function clampToRange(value: number, min: number, max: number): number {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

/** Constrains horizontal. */
export function constrainHorizontal(
    x: number,
    velocityX: number,
    minX: number,
    maxX: number,
    minReboundSpeed = 120,
): HorizontalConstraintResult {
    if (x < minX) {
        return {
            x: minX,
            velocityX: Math.max(minReboundSpeed, Math.abs(velocityX)),
        };
    }
    if (x > maxX) {
        return {
            x: maxX,
            velocityX: -Math.max(minReboundSpeed, Math.abs(velocityX)),
        };
    }
    return { x, velocityX };
}

/** Performs visible horizontal range. */
export function visibleHorizontalRange(
    viewLeftX: number,
    viewRightX: number,
    halfWidth: number,
): { minX: number; maxX: number } {
    return {
        minX: viewLeftX + halfWidth,
        maxX: viewRightX - halfWidth,
    };
}
