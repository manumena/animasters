import { ChangeEvent, useState } from 'react';
import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { HiOutlinePlus } from 'react-icons/hi'

export default function PlayersNamesForm() {

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

  function handleClickStart() {
    console.log('click')
  }

  
  function everyNameIsFilled() {
    return playerNames.every((name) => name.length > 0)
  }
  
  return (
    <>
      <div>
        <Form className='players-form'>
          { playerNames.map((name, id) => <Form.Control key={id} type="text" placeholder="Enter player name..." onChange={(e: ChangeEvent<HTMLInputElement>) => handleNameChange(e, id)} />)}
          <Button variant="outline-light" className='plus-button' onClick={handleClickPlus}><HiOutlinePlus/></Button>
        </Form>
      </div>
      <Button variant="outline-light" disabled={disabled} onClick={handleClickStart}>Start</Button>
    </>
  )
}
