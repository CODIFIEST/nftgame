import type * as Phaser from "phaser";

/** Configuration options for girder texture. */
type GirderTextureOptions = {
    key?: string;
    width?: number;
    height?: number;
};

/** Performs rounded rect path. */
function roundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
): void {
    const radius = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/** Performs fill rounded rect. */
function fillRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
): void {
    roundedRectPath(ctx, x, y, w, h, r);
    ctx.fill();
}

/** Ensures metal girder texture. */
export function ensureMetalGirderTexture(scene: Phaser.Scene, options: GirderTextureOptions = {}): void {
    const key = options.key ?? "ground";
    const width = options.width ?? 256;
    const height = options.height ?? 52;

    if (scene.textures.exists(key)) {
        scene.textures.remove(key);
    }

    const texture = scene.textures.createCanvas(key, width, height);
    const ctx = texture.context;
    ctx.clearRect(0, 0, width, height);

    // Painted weathered steel base coat.
    ctx.fillStyle = "rgba(126, 106, 92, 0.86)";
    ctx.fillRect(0, 0, width, height);

    // Top flange highlight + lower lip shadow.
    ctx.fillStyle = "rgba(180, 155, 136, 0.9)";
    ctx.fillRect(0, 0, width, 5);
    ctx.fillStyle = "rgba(92, 75, 65, 0.75)";
    ctx.fillRect(0, 5, width, 4);

    // Main web with subtle transparency.
    ctx.fillStyle = "rgba(122, 100, 86, 0.78)";
    ctx.fillRect(0, 9, width, 32);

    // Bottom flange + hard shadow line.
    ctx.fillStyle = "rgba(105, 86, 75, 0.86)";
    ctx.fillRect(0, 41, width, 8);
    ctx.fillStyle = "rgba(47, 36, 30, 0.86)";
    ctx.fillRect(0, 49, width, 3);

    const section = 64;

    // Repeating truss-like rounded web openings (true transparent cutouts).
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    for (let x = 4; x < width - 36; x += section) {
        fillRoundedRect(ctx, x + 10, 12, 40, 24, 7);
    }
    ctx.restore();

    // Opening edge highlight to suggest thickness.
    ctx.strokeStyle = "rgba(170, 144, 127, 0.24)";
    ctx.lineWidth = 1;
    for (let x = 4; x < width - 36; x += section) {
        roundedRectPath(ctx, x + 11, 13, 38, 22, 6);
        ctx.stroke();
    }

    // Diagonal members across each opening.
    ctx.strokeStyle = "rgba(71, 56, 50, 0.82)";
    ctx.lineWidth = 3;
    for (let x = 4; x < width - 36; x += section) {
        ctx.beginPath();
        ctx.moveTo(x + 14, 34);
        ctx.lineTo(x + 44, 14);
        ctx.stroke();
    }

    // Gusset plates around web joints.
    for (let x = 0; x < width; x += section) {
        ctx.fillStyle = "rgba(146, 119, 101, 0.88)";
        ctx.fillRect(x + 2, 7, 8, 10);
        ctx.fillRect(x + 2, 31, 8, 9);
        ctx.fillRect(x + 50, 7, 8, 10);
        ctx.fillRect(x + 50, 31, 8, 9);

        // Rivet clusters on plates.
        for (let ry = 9; ry <= 15; ry += 3) {
            ctx.fillStyle = "rgba(208, 182, 160, 0.92)";
            ctx.beginPath();
            ctx.arc(x + 4, ry, 0.9, 0, Math.PI * 2);
            ctx.arc(x + 8, ry, 0.9, 0, Math.PI * 2);
            ctx.arc(x + 52, ry, 0.9, 0, Math.PI * 2);
            ctx.arc(x + 56, ry, 0.9, 0, Math.PI * 2);
            ctx.fill();
        }
        for (let ry = 33; ry <= 37; ry += 2) {
            ctx.fillStyle = "rgba(195, 164, 140, 0.9)";
            ctx.beginPath();
            ctx.arc(x + 4, ry, 0.85, 0, Math.PI * 2);
            ctx.arc(x + 8, ry, 0.85, 0, Math.PI * 2);
            ctx.arc(x + 52, ry, 0.85, 0, Math.PI * 2);
            ctx.arc(x + 56, ry, 0.85, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Light weathering streaks.
    ctx.strokeStyle = "rgba(74, 58, 51, 0.22)";
    ctx.lineWidth = 1;
    for (let x = 12; x < width; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, 6);
        ctx.lineTo(x + 3, 46);
        ctx.stroke();
    }

    texture.refresh();
}
