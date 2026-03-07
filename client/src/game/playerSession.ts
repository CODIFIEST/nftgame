export type PersistedNft = {
    tokenAddress?: string;
    imageURL?: string;
};

type HydratePlayerSessionArgs = {
    playerNameKey: string;
    playerImageKey: string;
    playerNftKey: string;
    playerName: string | null | undefined;
    playerImage: string | null | undefined;
    playerNft: unknown;
    setPlayerName: (value: string) => void;
    setPlayerImage: (value: string) => void;
    setPlayerNft: (value: unknown) => void;
};

export function hydratePersistedPlayerState(args: HydratePlayerSessionArgs): void {
    if (typeof window === "undefined") {
        return;
    }

    const persistedName = sessionStorage.getItem(args.playerNameKey);
    if (persistedName && !args.playerName) {
        args.setPlayerName(persistedName);
    }

    const persistedImage = sessionStorage.getItem(args.playerImageKey);
    if (persistedImage && !args.playerImage) {
        args.setPlayerImage(persistedImage);
    }

    const persistedNft = sessionStorage.getItem(args.playerNftKey);
    if (persistedNft && !args.playerNft) {
        try {
            args.setPlayerNft(JSON.parse(persistedNft) as PersistedNft);
        } catch (error) {
            console.error("[GameDebug] failed to parse persisted NFT", error);
        }
    }
}

export function getPersistedNft(playerNftKey: string): PersistedNft | null {
    if (typeof window === "undefined") {
        return null;
    }
    const persistedNft = sessionStorage.getItem(playerNftKey);
    if (!persistedNft) {
        return null;
    }
    try {
        return JSON.parse(persistedNft) as PersistedNft;
    } catch (error) {
        console.error("[GameDebug] failed to parse persisted NFT for score save", error);
        return null;
    }
}

export function dataUrlToObjectUrl(dataUrl: string): string | null {
    const matches = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!matches) {
        return null;
    }
    const mimeType = matches[1] || "image/png";
    const base64 = matches[2];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
}
