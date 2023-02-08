import { writable } from "svelte/store";
import type { PlayerScore } from "../domain/playerscore";
const highscores = writable<PlayerScore[]>();
export default highscores