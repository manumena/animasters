import { useState } from "react";
import PlayersNamesForm from "../components/PlayersNamesForm";

type Song = {
  id: number
  name: string
  anime: string
  path: string
}

enum State { HOME, PLAYING, RESULTS }

export default function Home() {

  let players: string[]
  let songs: Song[]
  const [ state, setState ] = useState<State>(State.HOME)

  function handleClickStart(playerNames: string[]) {
    //Set players names
    players = playerNames

    // Request a match to match-generator
    fetch('https://match-generator.manuelmena19938676.workers.dev/generate-match')
      .then(response => response.json())
      .then(data => {
        songs = data.match
        setState(State.PLAYING)
      })
  }

  return (
    <div className="home-container">
      { state === State.HOME ? <PlayersNamesForm startCallback={handleClickStart} /> : <></> }
    </div>
  );
}