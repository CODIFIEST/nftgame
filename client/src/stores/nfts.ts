import { writable } from "svelte/store";
// import type { PlayerScore } from "../domain/playerscore";
import type {NFT} from "../../../server/domain/nft";
const nfts = writable<NFT[]>();
export default nfts;