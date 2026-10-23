import { useState } from "react"
import { GameButton } from "./GameControls"
import { HiOutlineMinus, HiOutlinePlus } from "react-icons/hi"

interface PlayerScoreProps {
  name: string
}

export default function PlayerScore({ name }: PlayerScoreProps) {

  const [ score, setScore ] = useState<number>(0)

  function handleClickPlus() {
    setScore(score + 1)
  }

  function handleClickMinus() {
    setScore(score - 1)
  }

  return (
    <div className="player-score-container">
      <div className="player-name">{name}</div>
      <div className="player-score">{score}</div>
      <GameButton aria-label={`Add point for ${name}`} onClick={handleClickPlus}><HiOutlinePlus/></GameButton>
      <GameButton aria-label={`Remove point for ${name}`} onClick={handleClickMinus}><HiOutlineMinus/></GameButton>
    </div>
  )
}
