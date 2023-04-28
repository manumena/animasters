import { useState } from "react";
import MainScreen from "../components/MainScreen";
import MatchScreen from "../components/MatchScreen";
import { Song } from "../types";

enum State { HOME, PLAYING, RESULTS }

export default function Home() {

  const [ players, setPlayers ] = useState<string[]>([])
  const [ songs, setSongs ] = useState<Song[]>([])
  const [ state, setState ] = useState<State>(State.HOME)

  function handleClickStart(playerNames: string[]) {
    //Set players names
    setPlayers(playerNames)

    // Request a match to match-generator
    fetch('https://match-generator.manuelmena19938676.workers.dev/generate-match')
      .then(response => response.json())
      .then(data => {
        // Set the response
        setSongs(data.match)

        // Change the game state
        setState(State.PLAYING)
      })
  }

  return (
    <>
      { state === State.HOME ? <MainScreen startCallback={handleClickStart} /> : <></> }
      { state === State.PLAYING ? <MatchScreen players={players} songs={songs} /> : <></> }
    </>
  );
}