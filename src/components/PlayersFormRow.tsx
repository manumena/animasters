import { ChangeEvent, useEffect, useRef } from "react";
import { Button, Form } from "react-bootstrap";
import { HiOutlinePlus } from "react-icons/hi";
import { RxCross1 } from "react-icons/rx";

interface PlayersFormRowProps {
  name: string
  totalPlayers: number
  id: number
  onChangeCallback: (e: ChangeEvent<HTMLInputElement>, id: number) => void
  onClickPlusCallback: () => void
  onClickMinusCallback: (id: number) => void
}

export default function PlayersFormRow({name, totalPlayers, id, onChangeCallback, onClickPlusCallback, onClickMinusCallback}: PlayersFormRowProps) {

  const ref = useRef(getNull());

  useEffect(() => {
    if (ref.current)
      ref.current.focus()
  }, [])
  
  return (
    <div>
      <Form.Control ref={ref} value={name} type="text" placeholder="Enter player name..." onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeCallback(e, id)} />
      { id === totalPlayers - 1 ? 
        <Button variant="outline-light" className='plus-button' onClick={onClickPlusCallback}><HiOutlinePlus/></Button> :
        <Button variant="outline-light" className='minus-button' onClick={() => onClickMinusCallback(id)}><RxCross1/></Button>
      }
    </div>
  )
}

// The compiler infers that useRef(null) can never be anything other than null https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type
function getNull(): any | null {
  return null
}
