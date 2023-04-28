import { useState } from "react"
import { Button } from "react-bootstrap"
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
      <Button variant="outline-light" onClick={handleClickPlus}><HiOutlinePlus/></Button>
      <Button variant="outline-light" onClick={handleClickMinus}><HiOutlineMinus/></Button>
    </div>
  )
}