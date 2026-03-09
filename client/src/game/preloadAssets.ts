import type * as Phaser from "phaser";

/** Arguments for select player sprite source. */
type SelectPlayerSpriteSourceArgs = {
    persistedImage: string;
    currentObjectUrl: string | null;
    dataUrlToObjectUrl: (dataUrl: string) => string | null;
};

/** Performs select player sprite source. */
export function selectPlayerSpriteSource(args: SelectPlayerSpriteSourceArgs): {
    selectedPlayerImage: string;
    runtimeSpriteObjectUrl: string | null;
} {
    if (args.currentObjectUrl) {
        URL.revokeObjectURL(args.currentObjectUrl);
    }

    let selectedPlayerImage = args.persistedImage;
    let runtimeSpriteObjectUrl: string | null = null;
    if (args.persistedImage.startsWith("data:")) {
        const objectUrl = args.dataUrlToObjectUrl(args.persistedImage);
        if (objectUrl) {
            runtimeSpriteObjectUrl = objectUrl;
            selectedPlayerImage = objectUrl;
        }
    }
    return { selectedPlayerImage, runtimeSpriteObjectUrl };
}

/** Preloads core assets assets. */
export function preloadCoreAssets(scene: Phaser.Scene, playerSpriteSrc: string): void {
    scene.load.image("sky", "./newsky.png");
    scene.load.image("ground", "./platform.png");
    scene.load.image("star", "./star.png");
    scene.load.image("bomb", "./bomb.png");
    scene.load.image("dude", playerSpriteSrc);
}
