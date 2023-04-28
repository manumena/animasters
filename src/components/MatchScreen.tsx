import { useState } from "react"
import { Song } from "../types"
import PlayerScore from "./PlayerScore"

interface MatchScreenProps {
  players: string[]
  songs: Song[]
}

export default function MatchScreen({ players, songs }: MatchScreenProps) {

  const [ currentSong, setCurrentSong ] = useState<number>(1)

  return (
    <>
      <div className="song-counter-container">
        <span>{currentSong} / {songs.length}</span>
      </div>
      <div className="players-score-container">
        { players.map((name, id) => <PlayerScore key={id} name={name} />) }
      </div>
    </>
  )
}