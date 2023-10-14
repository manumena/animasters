import { Match } from "../types";

export function fetchSongs(callbackOnFetch: (data: Match) => any, amount?: number) {
  // Build url
  const url = buildUrl(amount)

  // Request a match to match-generator
  fetch(url)
    .then(response => response.json())
    .then(data => callbackOnFetch(data))
}

function buildUrl(amount?: number) {
  let url = 'https://match-generator.manuelmena19938676.workers.dev/generate-match'
  if (amount)
    url += '?amount=' + amount
  return url
}
