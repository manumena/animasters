import { List, ListItem, TextField, Button, Container, Checkbox } from "@mui/material";
import { useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { styled } from '@mui/material/styles';
import { useGameStore } from "../stores/useGameStore";
import { ScreenContainer } from './GameControls';

export default function SettingsScreen() {
  const { saveSettings, settings } = useGameStore();

  const [newSongsPerRound, setNewSongsPerRound] = useState<number>(settings.songsPerRound);
  const [includeOpenings, setIncludeOpenings] = useState<boolean>(settings.includeOpenings);
  const [includeEndings, setIncludeEndings] = useState<boolean>(settings.includeEndings);
  const [includeSoundtracks, setIncludeSoundtracks] = useState<boolean>(settings.includeSoundtracks);

  function onChangeSongsPerRound(value: string) {
    const newValue = Number(value);
    if (newValue < 1000) setNewSongsPerRound(newValue);
  }

  return (
    <ScreenContainer>
      <Container>
        <Button
          style={{ float: "left", height: "60px" }}
          variant="outlined"
          onClick={() =>
            saveSettings({
              songsPerRound: newSongsPerRound,
              includeOpenings,
              includeEndings,
              includeSoundtracks,
            })
          }
          startIcon={<BsArrowLeft />}
        >
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
            slotProps={{ htmlInput: { 'aria-label': 'Songs per round' } }}
            onChange={(event) => onChangeSongsPerRound(event.target.value)}
            sx={{ width: "60px", input: { textAlign: "center" } }}
          />
        </FlexListItem>
        <FlexListItem>
          <span>Include openings</span>
          <Checkbox
            checked={includeOpenings}
            slotProps={{ input: { 'aria-label': 'Include openings' } }}
            onChange={(e) => setIncludeOpenings(e.target.checked)}
          />
        </FlexListItem>
        <FlexListItem>
          <span>Include endings</span>
          <Checkbox
            checked={includeEndings}
            slotProps={{ input: { 'aria-label': 'Include endings' } }}
            onChange={(e) => setIncludeEndings(e.target.checked)}
          />
        </FlexListItem>
        <FlexListItem>
          <span>Include soundtracks</span>
          <Checkbox
            checked={includeSoundtracks}
            slotProps={{ input: { 'aria-label': 'Include soundtracks' } }}
            onChange={(e) => setIncludeSoundtracks(e.target.checked)}
          />
        </FlexListItem>
      </List>
    </ScreenContainer>
  );
}

const FlexListItem = styled(ListItem)`
  display: flex;
  justify-content: space-between;
`;
