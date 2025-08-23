import { List, ListItem, TextField, Button, Container, Checkbox } from "@mui/material";
import { useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
import styled from "styled-components";
import { useGameStore } from "../stores/useGameStore";

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
    <SettingsScreenContainer>
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
            onChange={(event) => onChangeSongsPerRound(event.target.value)}
            sx={{ width: "60px", input: { textAlign: "center" } }}
          />
        </FlexListItem>
        <FlexListItem>
          <span>Include openings</span>
          <Checkbox
            checked={includeOpenings}
            onChange={(e) => setIncludeOpenings(e.target.checked)}
          />
        </FlexListItem>
        <FlexListItem>
          <span>Include endings</span>
          <Checkbox
            checked={includeEndings}
            onChange={(e) => setIncludeEndings(e.target.checked)}
          />
        </FlexListItem>
        <FlexListItem>
          <span>Include soundtracks</span>
          <Checkbox
            checked={includeSoundtracks}
            onChange={(e) => setIncludeSoundtracks(e.target.checked)}
          />
        </FlexListItem>
      </List>
    </SettingsScreenContainer>
  );
}

const SettingsScreenContainer = styled.div`
  text-align: center;
  position: absolute;
  width: 600px;
  top: 20%;
  left: 50%;
  transform: translate(-50%);
`;

const FlexListItem = styled(ListItem)`
  display: flex;
  justify-content: space-between;
`;
