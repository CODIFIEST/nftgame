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

# Run
1. `npm install`
2. `npm run dev`

# Quality checks
1. `npm run check`
2. `npm run build`

# Runtime notes
1. `VITE_API_BASE_URL` can override backend URL. Defaults to production server URL.
2. Game route is lazy-loaded to reduce initial bundle impact.
3. Score posting has retry + pending queue sync with manual sync button in-game.
