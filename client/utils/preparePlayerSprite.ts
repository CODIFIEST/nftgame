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

function luminance(r: number, g: number, b: number): number {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
    const edgeLum = luminance(edgeR, edgeG, edgeB);

    // Remove only edge-connected background-like pixels so foreground details survive.
    const tolerance = 34;
    const maxLuminanceDelta = 24;
    const width = canvas.width;
    const height = canvas.height;
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    function pushIfBackgroundCandidate(x: number, y: number) {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            return;
        }
        const idx = y * width + x;
        if (visited[idx]) {
            return;
        }
        const pixelIndex = idx * 4;
        if (pixels[pixelIndex + 3] < 8) {
            visited[idx] = 1;
            queue.push(idx);
            return;
        }
        const dist = colorDistance(
            pixels[pixelIndex],
            pixels[pixelIndex + 1],
            pixels[pixelIndex + 2],
            edgeR,
            edgeG,
            edgeB,
        );
        const lum = luminance(pixels[pixelIndex], pixels[pixelIndex + 1], pixels[pixelIndex + 2]);
        if (dist <= tolerance && Math.abs(lum - edgeLum) <= maxLuminanceDelta) {
            visited[idx] = 1;
            queue.push(idx);
        }
    }

    for (let x = 0; x < width; x += 1) {
        pushIfBackgroundCandidate(x, 0);
        pushIfBackgroundCandidate(x, height - 1);
    }
    for (let y = 0; y < height; y += 1) {
        pushIfBackgroundCandidate(0, y);
        pushIfBackgroundCandidate(width - 1, y);
    }

    while (queue.length > 0) {
        const idx = queue.shift() as number;
        const x = idx % width;
        const y = Math.floor(idx / width);
        pushIfBackgroundCandidate(x + 1, y);
        pushIfBackgroundCandidate(x - 1, y);
        pushIfBackgroundCandidate(x, y + 1);
        pushIfBackgroundCandidate(x, y - 1);
    }

    for (let i = 0; i < visited.length; i += 1) {
        if (visited[i]) {
            const pixelIndex = i * 4;
            pixels[pixelIndex + 3] = 0;
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
