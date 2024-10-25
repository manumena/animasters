import { useEffect, useState } from "react";
import MainScreen from "../components/MainScreen";
import MatchScreen from "../components/MatchScreen";
import { Match, Song } from "../types";
import { fetchSongs } from "../api/fetch";
import SettingsScreen from "../components/SettingsScreen";

enum State { HOME, PLAYING, RESULTS, SETTINGS }
export const SONGS_PER_ROUND = 40

export default function Home() {

  const [ players, setPlayers ] = useState<string[]>([])
  const [ songs, setSongs ] = useState<Song[]>([])
  const [ state, setState ] = useState<State>(State.HOME)

  useEffect(() => {
    console.log('songs changed', songs)
    // Change the game state if songs are retrieved
    if (songs && songs.length > 0)
        setState(State.PLAYING)
  }, [songs])

  function handleClickStart(playerNames: string[]) {
    //Set players names
    setPlayers(playerNames)

    // Request a match to match-generator
    fetchSongs((data: Match) => {
      // Set the response
      setSongs(data.match)
    },
    SONGS_PER_ROUND
    )
  }

  function handleClickSettings() {
    // Change the game state to settings
    setState(State.SETTINGS)
  }

  function handleClickBackFromSettings() {
    // Change the game state to settings
    setState(State.HOME)
  }

  return (
    <>
      { state === State.HOME ? <MainScreen startCallback={handleClickStart} settingsCallback={handleClickSettings} /> : <></> }
      { state === State.PLAYING ? <MatchScreen players={players} matchSongs={songs} /> : <></> }
      { state === State.SETTINGS ? <SettingsScreen backCallback={handleClickBackFromSettings} /> : <></>}
    </>
  );
}