/// <reference types="svelte" />
/// <reference types="vite/client" />

/** Type definition for import meta env. */
interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_HELIUS_API_KEY?: string;
    readonly VITE_HELIUS_RPC_URL?: string;
    readonly VITE_SOL_COLLECTION_ADDRESS?: string;
    readonly VITE_QUICKNODE_APK?: string;
}

/** Type definition for import meta. */
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
