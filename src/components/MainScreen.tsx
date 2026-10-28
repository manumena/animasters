import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ScreenContainer } from './GameControls';

export default function MainScreen() {
  return (
    <ScreenContainer>
      <h1>AniMasters</h1>
      <Button component={RouterLink} to="/rooms" variant="outlined" sx={{ mb: 2 }}>Create or join a room</Button>
    </ScreenContainer>
  );
}
