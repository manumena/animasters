import { Settings } from "../stores/useGameStore";
import { Match } from "../types";

export function fetchSongs(callbackOnFetch: (data: Match) => void, settings: Settings) {
  // Build url
  const url = buildUrl(settings)

  // Request a match to match-generator
  fetch(url)
    .then(response => response.json())
    .then(data => callbackOnFetch(data))
}

function buildUrl({ songsPerRound, includeOpenings, includeEndings, includeSoundtracks }: Settings): string {
  let url = 'https://match-generator.manuelmena19938676.workers.dev/generate-match'
  // let url = 'http://127.0.0.1:8787/generate-match'
  if (songsPerRound)
    url += '?amount=' + songsPerRound
  if (includeOpenings)
    url += '&includeOpenings=' + includeOpenings
  if (includeEndings)
    url += '&includeEndings=' + includeEndings
  if (includeSoundtracks)
    url += '&includeSoundtracks=' + includeSoundtracks
  return url
}
