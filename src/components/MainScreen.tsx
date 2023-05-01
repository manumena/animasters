import { ChangeEvent, useState } from 'react';
import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { HiOutlinePlus } from 'react-icons/hi'
import PlayersFormRow from './PlayersFormRow';

interface PlayersNamesFormProps {
  startCallback: (playerNames: string[]) => void
}

export default function MainScreen({ startCallback }: PlayersNamesFormProps) {

  const [ playerNames, setPlayerNames] = useState<string[]>([''])
  const [ disabled, setDisabled ] = useState<boolean>(true)

  function handleNameChange(e: ChangeEvent<HTMLInputElement>, id: number) {
    const updatedNames = [...playerNames]
    updatedNames[id] = e.currentTarget.value
    setPlayerNames(updatedNames)
    setDisabled(!everyNameIsFilled())
  }

  function handleClickPlus() {
    const updatedNames = [...playerNames, '']
    setPlayerNames(updatedNames)
    setDisabled(true)
  }

  function handleClickMinus(id: number) {
    const updatedNames = [...playerNames]
    updatedNames.splice(id, 1)
    setPlayerNames(updatedNames)
  }

  function everyNameIsFilled() {
    return playerNames.every((name) => name.length > 0)
  }
  
  return (
    <div className='main-screen-container'>
      <h1>AniMasters</h1>
      <p>Immerse yourself in the captivating world of anime and test your knowledge by trying to guess the anime series from its opening theme</p>
      <div>
        <div className='players-form'>
          { playerNames.map((name, id) => <PlayersFormRow name={name} key={id} totalPlayers={playerNames.length} id={id} onChangeCallback={handleNameChange} onClickPlusCallback={handleClickPlus} onClickMinusCallback={handleClickMinus}/>)}
        </div>
      </div>
      <Button variant="outline-light" disabled={disabled} className='start-button' onClick={() => {startCallback(playerNames)}}>Start</Button>
    </div>
  )
}
