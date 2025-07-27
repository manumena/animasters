import { useLayoutEffect, useState } from "react"
import { Match, Song } from "../types"
import PlayerScore from "./PlayerScore"
import { Button } from "react-bootstrap"
import { BsArrowRight, BsArrowLeft } from "react-icons/bs"
import { fetchSongs } from "../api/fetch"
import { Settings } from "../stores/useGameStore"


type MatchScreenProps = Settings & {
  players: string[]
  matchSongs: Song[]
}

const FIREBASE_DOMAIN = "https://firebasestorage.googleapis.com/v0/b/guess-the-anime-a6470.appspot.com/o/"
const REVEAL_BUTTON_LABEL = 'Reveal'
const NEW_ROUND = 'New Round'

export default function MatchScreen({ players, matchSongs, songsPerRound }: MatchScreenProps) {
  const [ songs, setSongs] = useState<Song[]>(matchSongs)
  const [ currentSong, setCurrentSong ] = useState<number>(0)
  const [ revealedSongs, setRevealedSongs ] = useState<boolean[]>(Array.from(Array(songs.length).keys()).map(() => false))
  const [ revealButtonLabel, setRevealButtonLabel ] = useState<string>(REVEAL_BUTTON_LABEL)

  function goToPreviousSong() {
    if (currentSong > 0)
      setCurrentSong(currentSong - 1)
  }

  function goToNextSong() {
    if (currentSong < songs.length - 1)
      setCurrentSong(currentSong + 1)
  }

  function revealCurrentSong() {
    const revealed = revealedSongs
    revealed[currentSong] = true
    setRevealedSongs(revealed)
    setRevealButtonLabel(`${songs[currentSong].anime} - ${songs[currentSong].name}`)
  }

  function startNextRound() {
    fetchSongs((data: Match) => {
      // Override songs
      setSongs(data.match)

      // Set current song to the first one
      setCurrentSong(0)

      // Restart reveal button
      setRevealButtonLabel(REVEAL_BUTTON_LABEL)
      setRevealedSongs(Array.from(Array(data.match.length).keys()).map(() => false))
    },
    songsPerRound)
  }
  
  useLayoutEffect(() => {
    setRevealButtonLabel(revealedSongs[currentSong] ? `${songs[currentSong].anime} - ${songs[currentSong].name}` : REVEAL_BUTTON_LABEL)
  }, [revealedSongs, currentSong, songs])

  return (
    <>
      <div className="song-counter-container">
        <span>{currentSong + 1} / {songs.length}</span>
      </div>
      <div className="players-score-container">
        { players.map((name, id) => <PlayerScore key={id} name={name} />) }
      </div>
      <div className="song-controls-container">
        <div className="audio-player-container">
          <audio 
            controls={true}
            loop={true}
            src={FIREBASE_DOMAIN + songs[currentSong].path}
          />
        </div>
        <div className="song-navigation-container">
          <Button variant="outline-light" onClick={goToPreviousSong}><BsArrowLeft/></Button>
          <Button variant="outline-light" onClick={revealCurrentSong}>{revealButtonLabel}</Button>
          <Button variant="outline-light" onClick={goToNextSong}><BsArrowRight/></Button>
        </div>
        <div className="new-round-container">
          <Button variant="outline-light" onClick={startNextRound}>{NEW_ROUND}</Button>
        </div>
      </div>
    </>
  )
}