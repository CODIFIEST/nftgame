import { writable } from "svelte/store";
import type { NFT } from "../../../server/domain/nft";
const player1nft = writable<NFT>();
export default player1nft