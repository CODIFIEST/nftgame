import { writable } from "svelte/store";
import type { PlayerScore } from "../domain/playerscore";
const player1 = writable<PlayerScore>();
export default player1