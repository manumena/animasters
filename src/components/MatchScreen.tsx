import { useState } from "react"
import { Song } from "../types"
import PlayerScore from "./PlayerScore"

interface MatchScreenProps {
  players: string[]
  songs: Song[]
}

const FIREBASE_DOMAIN = "https://firebasestorage.googleapis.com/v0/b/guess-the-anime-a6470.appspot.com/o/"

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
      <div className="audio-player-container">
        <audio 
          controls={true}
          loop={true}
          src={FIREBASE_DOMAIN + songs[currentSong].path}
        />
      </div>
    </>
  )
}