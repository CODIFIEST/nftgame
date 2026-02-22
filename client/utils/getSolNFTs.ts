import { NFTType, type NFT } from "../../server/domain/nft";
import axios from "axios";

type HeliusAsset = {
    id?: string;
    grouping?: Array<{ group_key?: string; group_value?: string }>;
    collection?: { address?: string };
    content?: {
        metadata?: {
            name?: string;
            description?: string;
            image?: string;
            mint?: string;
        };
        links?: {
            image?: string;
        };
        files?: Array<{ uri?: string }>;
    };
};

type HeliusResponse = {
    result?: {
        items?: HeliusAsset[];
    };
};

type QuickNodeAsset = {
    name?: string;
    description?: string;
    imageUrl?: string;
    collecctionAddress?: string;
    collectionAddress?: string;
    tokenAddress?: string;
};

type QuickNodeResponse = {
    result?: {
        totalPages?: number;
        pageNumber?: number;
        assets?: QuickNodeAsset[];
    };
};

function resolveRpcUrl(): string | null {
    const heliusApiKey = import.meta.env.VITE_HELIUS_API_KEY?.trim();
    if (heliusApiKey) {
        return `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
    }

    const heliusRpcUrl = import.meta.env.VITE_HELIUS_RPC_URL?.trim();
    if (heliusRpcUrl) {
        return heliusRpcUrl;
    }

    const quickNodeUrl = import.meta.env.VITE_QUICKNODE_APK?.trim();
    if (quickNodeUrl) {
        return quickNodeUrl;
    }

    return null;
}

function assetCollectionAddress(asset: HeliusAsset): string {
    const groupingCollection = asset.grouping?.find(
        (group) => group.group_key === "collection",
    )?.group_value;

    return (groupingCollection ?? asset.collection?.address ?? "").trim();
}

function assetImageUrl(asset: HeliusAsset): string {
    return (
        asset.content?.links?.image ??
        asset.content?.files?.[0]?.uri ??
        asset.content?.metadata?.image ??
        ""
    );
}

function mapHeliusAsset(asset: HeliusAsset, collectionAddress: string): NFT {
    return {
        title: asset.content?.metadata?.name ?? "",
        description: asset.content?.metadata?.description ?? "",
        imageURL: assetImageUrl(asset),
        collecctionAddress: collectionAddress,
        tokenAddress: asset.content?.metadata?.mint ?? asset.id ?? "",
        nftType: NFTType.Solana,
    };
}

function mapQuickNodeAsset(asset: QuickNodeAsset, collectionAddress: string): NFT {
    return {
        title: asset.name ?? "",
        description: asset.description ?? "",
        imageURL: asset.imageUrl ?? "",
        collecctionAddress: collectionAddress,
        tokenAddress: asset.tokenAddress ?? "",
        nftType: NFTType.Solana,
    };
}

async function fetchWithHelius(address: string, rpcUrl: string, collectionAddress: string): Promise<NFT[]> {
    const config = {
        headers: { "Content-Type": "application/json" },
    };
    const pageSize = 1000;
    const domainNFTs: NFT[] = [];
    let page = 1;

    while (true) {
        const data = {
            jsonrpc: "2.0",
            id: page,
            method: "getAssetsByOwner",
            params: {
                ownerAddress: address,
                page,
                limit: pageSize,
            },
        };

        const response = await axios.post<HeliusResponse>(rpcUrl, data, config);
        const items = response.data.result?.items ?? [];
        const matchedAssets = items.filter(
            (asset) => assetCollectionAddress(asset) === collectionAddress,
        );

        matchedAssets.forEach((asset) => {
            domainNFTs.push(mapHeliusAsset(asset, collectionAddress));
        });

        if (items.length < pageSize) {
            break;
        }
        page += 1;
    }

    return domainNFTs;
}

async function fetchWithQuickNode(address: string, rpcUrl: string, collectionAddress: string): Promise<NFT[]> {
    const config = {
        headers: { "Content-Type": "application/json" },
    };
    const domainNFTs: NFT[] = [];
    const pageSize = 40;
    let page = 1;

    while (true) {
        const data = {
            jsonrpc: "2.0",
            id: page,
            method: "qn_fetchNFTs",
            params: {
                wallet: address,
                omitFields: ["provenance", "traits"],
                page,
                perPage: pageSize,
            },
        };

        const response = await axios.post<QuickNodeResponse>(rpcUrl, data, config);
        const result = response.data.result;
        const assets = result?.assets ?? [];

        assets
            .filter((asset) => {
                const addr = (asset.collecctionAddress ?? asset.collectionAddress ?? "").trim();
                return addr === collectionAddress;
            })
            .forEach((asset) => {
                domainNFTs.push(mapQuickNodeAsset(asset, collectionAddress));
            });

        const totalPages = result?.totalPages ?? 0;
        const pageNumber = result?.pageNumber ?? page;
        if (pageNumber >= totalPages || assets.length < pageSize) {
            break;
        }
        page += 1;
    }

    return domainNFTs;
}

async function getSolNFTs(address: string): Promise<NFT[]> {
    const collectionAddress = import.meta.env.VITE_SOL_COLLECTION_ADDRESS?.trim();
    if (!collectionAddress) {
        console.error("[getSolNFTs] Missing VITE_SOL_COLLECTION_ADDRESS.");
        return [];
    }

    const rpcUrl = resolveRpcUrl();
    if (!rpcUrl) {
        console.error("[getSolNFTs] Missing RPC endpoint. Set VITE_HELIUS_API_KEY, VITE_HELIUS_RPC_URL, or VITE_QUICKNODE_APK.");
        return [];
    }

    try {
        if (import.meta.env.VITE_HELIUS_API_KEY?.trim() || import.meta.env.VITE_HELIUS_RPC_URL?.trim()) {
            return await fetchWithHelius(address, rpcUrl, collectionAddress);
        }
        return await fetchWithQuickNode(address, rpcUrl, collectionAddress);
    } catch (error) {
        console.error("[getSolNFTs] Failed to fetch Solana NFTs.", error);
        return [];
    }
}

export default getSolNFTs;
