import { writable } from "svelte/store";
const playerName = writable<string>("");
export default playerName;
