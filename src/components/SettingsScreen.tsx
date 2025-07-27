import { List, ListItem, TextField, Button, Container } from "@mui/material"
import { useState } from "react"
import { BsArrowLeft } from "react-icons/bs"
import styled from "styled-components"
import { Settings } from "../stores/useGameStore"

interface SettingsScreenProps {
    songsPerRound: number
    backCallback: (newSettings: Settings) => void
}
export default function SettingsScreen({ songsPerRound, backCallback}: SettingsScreenProps) {
    const [ newSongsPerRound, setNewSongsPerRound ] = useState<number>(songsPerRound)

    function onChangeSongsPerRound(value: string) {
        const newValue = Number(value)
        if (newValue < 1000)
            setNewSongsPerRound(newValue)
    }

    return (
        <SettingsScreenContainer>
            <Container>
                <Button 
                    style={{float: 'left', height: '60px'}}
                    variant="outlined"
                    onClick={() => backCallback({songsPerRound: newSongsPerRound})}
                    startIcon={<BsArrowLeft/>}>
                    Back
                </Button>
                <h1>Settings</h1>
            </Container>
            <List>
                <FlexListItem>
                    <span>Songs per round</span>
                    <TextField 
                        id="outlined-basic"
                        variant="outlined"
                        value={newSongsPerRound}
                        onChange={(event) => onChangeSongsPerRound(event.target.value)}
                        sx={{width: '60px', input: {textAlign: 'center'}}}
                        />
                </FlexListItem>
            </List>
        </SettingsScreenContainer>
    )
}

const SettingsScreenContainer = styled.div`
  text-align: center;
  position: absolute;
  width: 600px;
  top: 20%;
  left: 50%;
  transform: translate(-50%);
`

const FlexListItem = styled(ListItem)`
    display: flex;
    justify-content: space-between;
`