import { ChangeEvent, useEffect, useState } from 'react';
import PlayersFormRow from './PlayersFormRow';
import { IoSettingsSharp } from "react-icons/io5"
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useGameStore } from '../stores/useGameStore';
import { ScreenContainer, SideButton } from './GameControls';
import { Link as RouterLink } from 'react-router-dom';


export default function MainScreen() {

  const [ playerNames, setPlayerNames] = useState<string[]>([''])
  const [ disabled, setDisabled ] = useState<boolean>(true)

  const { startGame, openSettings } = useGameStore();

  useEffect(() => {
    function everyNameIsFilled() {
      return playerNames.every((name) => name.length > 0)
    }

    setDisabled(!everyNameIsFilled())
  }, [playerNames])

  function handleNameChange(e: ChangeEvent<HTMLInputElement>, id: number) {
    const updatedNames = [...playerNames]
    updatedNames[id] = e.currentTarget.value
    setPlayerNames(updatedNames)
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

  return (
    <ScreenContainer>
      <h1>AniMasters</h1>
      <div>
        <div className='players-form'>
          { playerNames.map((name, id) =>
            <PlayersFormRow name={name} key={id} totalPlayers={playerNames.length} id={id} onChangeCallback={handleNameChange} onClickPlusCallback={handleClickPlus} onClickMinusCallback={handleClickMinus}/>
          )}
        </div>
      </div>
      <StartButton variant="outlined" disabled={disabled} onClick={() => {startGame(playerNames)}}>Start</StartButton>
      <SideButton aria-label="Settings" variant="outlined" onClick={openSettings}><IoSettingsSharp /></SideButton>
      <Button component={RouterLink} to="/catalog" sx={{ display: 'block', mt: 2 }}>Browse anime catalog</Button>
    </ScreenContainer>
  )
}

const StartButton = styled(Button)`
  height: 38px;
  width: 200px;
`
