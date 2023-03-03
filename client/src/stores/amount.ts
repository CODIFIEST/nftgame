import { writable } from "svelte/store";

const amount = writable<string>();
export { amount};