import { ChangeEvent, useEffect, useRef } from "react";
import { HiOutlinePlus } from "react-icons/hi";
import { RxCross1 } from "react-icons/rx";
import { PlayerNameInput, SideButton } from "./GameControls";

interface PlayersFormRowProps {
  name: string
  totalPlayers: number
  id: number
  onChangeCallback: (e: ChangeEvent<HTMLInputElement>, id: number) => void
  onClickPlusCallback: () => void
  onClickMinusCallback: (id: number) => void
}

export default function PlayersFormRow({name, totalPlayers, id, onChangeCallback, onClickPlusCallback, onClickMinusCallback}: PlayersFormRowProps) {

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current)
      ref.current.focus()
  }, [])
  
  return (
    <div>
      <PlayerNameInput inputRef={ref} value={name} type="text" placeholder="Enter player name..." slotProps={{ input: { 'aria-label': `Player ${id + 1} name` } }} onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeCallback(e, id)} />
      { id === totalPlayers - 1 ?
        <SideButton aria-label="Add player" variant="outlined" onClick={onClickPlusCallback}><HiOutlinePlus/></SideButton> :
        <SideButton aria-label="Remove player" variant="outlined" onClick={() => onClickMinusCallback(id)}><RxCross1/></SideButton>
      }
    </div>
  )
}
