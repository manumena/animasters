import { Match } from "../types";

export function fetchSongs(callbackOnFetch: (data: Match) => any) {
  // Request a match to match-generator
  fetch('https://match-generator.manuelmena19938676.workers.dev/generate-match')
    .then(response => response.json())
    .then(data => callbackOnFetch(data))
}
