<script lang="ts">
    import { push } from "svelte-spa-router";
    import connectPhantom from "../../utils/connectPhantom";
    import connectMetamask from "../../utils/connectMetamask";

    // import connectPhantom from "../utils/connectPhantom"
</script>

<section class="login-shell">
    <h1 class="login-title">Connect your wallet to choose your NGMI Panda</h1>

    <div class="wallets">
        <button
            class="wallet-button"
            type="button"
            aria-label="Connect Phantom wallet"
            on:click={async () => {
                await connectPhantom();
                await push("/displaychars");
            }}
        >
            <img class="wallet-image" alt="phantom wallet" src="phantom-icon-purple.png" />
            <span>Phantom</span>
        </button>

        <button
            class="wallet-button"
            type="button"
            aria-label="Connect MetaMask wallet"
            on:click={async () => {
                await connectMetamask();
                await push("/displaychars");
            }}
        >
            <img
                class="wallet-image"
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="metamask fox"
            />
            <span>MetaMask</span>
        </button>
    </div>
</section>

    <style>
        .login-shell {
            width: 100%;
            max-width: 980px;
            margin: 0 auto;
            padding: 76px 12px 20px;
            color: var(--theme-text);
        }

        .login-title {
            margin: 0 0 18px;
            font-size: clamp(26px, 4vw, 40px);
            font-weight: 800;
            line-height: 1.15;
            color: var(--theme-heading);
        }

        .wallets {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            justify-content: center;
            max-width: 760px;
            margin: 0 auto;
        }

        .wallet-button {
            border: 1px solid var(--theme-border);
            background: var(--theme-panel);
            border-radius: 12px;
            color: var(--theme-text);
            min-width: 170px;
            padding: 12px 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
        }

        .wallet-image {
            width: 34px;
            height: 34px;
            object-fit: contain;
            display: block;
        }

        @media (max-width: 768px) {
            .login-shell {
                padding-top: 72px;
            }

            .wallet-button {
                width: 100%;
                min-width: 0;
                font-size: 16px;
            }
        }
    </style>
    
