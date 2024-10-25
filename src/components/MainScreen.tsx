import { ChangeEvent, useEffect, useState } from 'react';
import PlayersFormRow from './PlayersFormRow';
import { IoSettingsSharp } from "react-icons/io5"
import { Button } from '@mui/material';
import styled from '@emotion/styled';

interface PlayersNamesFormProps {
  startCallback: (playerNames: string[]) => void
  settingsCallback: () => void
}

export default function MainScreen({ startCallback, settingsCallback }: PlayersNamesFormProps) {

  const [ playerNames, setPlayerNames] = useState<string[]>([''])
  const [ disabled, setDisabled ] = useState<boolean>(true)

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
    <MainScreenContainer>
      <h1>AniMasters</h1>
      <div>
        <div className='players-form'>
          { playerNames.map((name, id) =>
            <PlayersFormRow name={name} key={id} totalPlayers={playerNames.length} id={id} onChangeCallback={handleNameChange} onClickPlusCallback={handleClickPlus} onClickMinusCallback={handleClickMinus}/>
          )}
        </div>
      </div>
      <StartButton variant="outlined" disabled={disabled} onClick={() => {startCallback(playerNames)}}>Start</StartButton>
      <SideButton variant="outlined" onClick={() => settingsCallback()}><IoSettingsSharp /></SideButton>
    </MainScreenContainer>
  )
}

const MainScreenContainer = styled.div`
  text-align: center;
  position: absolute;
  width: 600px;
  top: 20%;
  left: 50%;
  transform: translate(-50%);
`

const StartButton = styled(Button)`
  height: 38px;
  width: 200px;
`

export const SideButton = styled(Button)`
  margin-left: 5px;
  position: absolute;
  padding: 6px 10px 6px 10px
  width: 38px;
  height: 38px;
  min-width: 0px;
`
