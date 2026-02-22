/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_HELIUS_API_KEY?: string;
    readonly VITE_HELIUS_RPC_URL?: string;
    readonly VITE_SOL_COLLECTION_ADDRESS?: string;
    readonly VITE_QUICKNODE_APK?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
