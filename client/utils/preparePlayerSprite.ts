function imageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image for sprite preparation."));
        image.src = url;
    });
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

export default async function preparePlayerSprite(url: string): Promise<string> {
    const image = await imageFromUrl(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
        throw new Error("Canvas context unavailable.");
    }

    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;

    const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
    ];

    let r = 0;
    let g = 0;
    let b = 0;
    corners.forEach(([x, y]) => {
        const idx = (y * canvas.width + x) * 4;
        r += pixels[idx];
        g += pixels[idx + 1];
        b += pixels[idx + 2];
    });
    const edgeR = r / corners.length;
    const edgeG = g / corners.length;
    const edgeB = b / corners.length;

    const tolerance = 78;
    for (let i = 0; i < pixels.length; i += 4) {
        const dist = colorDistance(
            pixels[i],
            pixels[i + 1],
            pixels[i + 2],
            edgeR,
            edgeG,
            edgeB,
        );
        if (dist <= tolerance) {
            pixels[i + 3] = 0;
        }
    }
    ctx.putImageData(imgData, 0, 0);

    const alphaFloor = 20;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
            const idx = (y * canvas.width + x) * 4;
            if (pixels[idx + 3] > alphaFloor) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX < minX || maxY < minY) {
        return canvas.toDataURL("image/png");
    }

    const pad = 4;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(canvas.width - 1, maxX + pad);
    maxY = Math.min(canvas.height - 1, maxY + pad);

    const trimmed = document.createElement("canvas");
    trimmed.width = maxX - minX + 1;
    trimmed.height = maxY - minY + 1;
    const trimmedCtx = trimmed.getContext("2d");
    if (!trimmedCtx) {
        return canvas.toDataURL("image/png");
    }
    trimmedCtx.drawImage(
        canvas,
        minX,
        minY,
        trimmed.width,
        trimmed.height,
        0,
        0,
        trimmed.width,
        trimmed.height,
    );

    return trimmed.toDataURL("image/png");
}
