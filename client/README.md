# client
The frontend Svelte app for our app

# ENV
Create `client/.env` with:

```env
VITE_HELIUS_API_KEY=your_helius_api_key
VITE_SOL_COLLECTION_ADDRESS=your_ngmi_collection_address
```

Optional:

```env
# Optional override if you want to provide the full RPC URL directly.
VITE_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_api_key

# Deprecated compatibility fallback (used only if Helius vars are absent).
VITE_QUICKNODE_APK=https://your-quicknode-endpoint
```

# TASKS
1. A form that lets a user type their name, their age, and their ethereum address, then sends it to the backend to be saved.

2. A page that displays all the users in a grid.
