import { ChangeEvent, useState } from 'react';
import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { HiOutlinePlus } from 'react-icons/hi'

interface PlayersNamesFormProps {
  startCallback: (playerNames: string[]) => void
}

export default function PlayersNamesForm({ startCallback }: PlayersNamesFormProps) {

  const [ playerNames, setNames] = useState<string[]>([''])
  const [ disabled, setDisabled ] = useState<boolean>(true)

  function handleNameChange(e: ChangeEvent<HTMLInputElement>, id: number) {
    const updatednames = playerNames
    updatednames[id] = e.currentTarget.value
    setNames(updatednames)
    setDisabled(!everyNameIsFilled())
  }

  function handleClickPlus() {
    const updatedNames = [...playerNames, '']
    setNames(updatedNames)
    setDisabled(true)
  }

  function everyNameIsFilled() {
    return playerNames.every((name) => name.length > 0)
  }
  
  return (
    <>
      <h1>AniMasters</h1>
      <p>Immerse yourself in the captivating world of anime and test your knowledge by trying to guess the anime series from its opening theme</p>
      <div>
        <Form className='players-form'>
          { playerNames.map((name, id) => <Form.Control key={id} type="text" placeholder="Enter player name..." onChange={(e: ChangeEvent<HTMLInputElement>) => handleNameChange(e, id)} />)}
          <Button variant="outline-light" className='plus-button' onClick={handleClickPlus}><HiOutlinePlus/></Button>
        </Form>
      </div>
      <Button variant="outline-light" disabled={disabled} className='start-button' onClick={() => {startCallback(playerNames)}}>Start</Button>
    </>
  )
}
