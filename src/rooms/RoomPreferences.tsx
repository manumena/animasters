import { useSyncExternalStore } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { RoomPreferencesController, songTypes } from './preferences';

interface Props {
  controller: RoomPreferencesController;
  isHost: boolean;
  isReady: boolean;
  isRematch?: boolean;
}

/** The controller belongs to RoomGame, so leaving this screen neither discards
 * a draft nor cancels an outstanding save. Server snapshots confirm changes. */
export default function RoomPreferences({
  controller,
  isHost,
  isReady,
  isRematch = false,
}: Props) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  if (!state.draft)
    return <Typography role="status">Loading match settings…</Typography>;

  return (
    <Stack spacing={2} className="room-preferences">
      <div className="room-preferences-heading">
        <Typography component="h2" variant="h6">
          {isRematch ? 'Next match preferences' : 'Song selection'}
        </Typography>
      </div>

      {isHost ? (
        <>
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
            <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
              Songs per match
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              aria-label="Songs per match"
              value={Number(state.amount)}
              disabled={!state.editable}
              onChange={(_, amount: number | null) => {
                // Clicking the selected option must not clear the song count.
                if (amount !== null)
                  controller.changeAmount(String(amount), true);
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  minHeight: 48,
                  color: '#d5e5e4',
                  borderColor: '#62767c',
                  fontSize: 16,
                  '&.Mui-selected': {
                    bgcolor: '#a7ecdb',
                    color: '#123e34',
                    '&:hover': { bgcolor: '#bdf5e7' },
                  },
                  '&.Mui-disabled': { color: '#adb5bd' },
                },
              }}
            >
              {[5, 10, 20, 50].map((amount) => (
                <ToggleButton
                  key={amount}
                  value={amount}
                  aria-label={`${amount} songs`}
                >
                  {amount}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {/* Existing rooms can retain older counts until the host chooses a preset. */}
            {![5, 10, 20, 50].includes(Number(state.amount)) && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Current match: {state.amount} songs
              </Typography>
            )}
          </Box>
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
            <Typography component="legend" variant="body2">
              Song types
            </Typography>
            {(
              [
                ['includeOpenings', 'Include openings'],
                ['includeEndings', 'Include endings'],
                ['includeSoundtracks', 'Include soundtracks'],
              ] as const
            ).map(([field, label]) => (
              <FormControlLabel
                key={field}
                label={label}
                sx={{
                  display: 'flex',
                  m: 0,
                  mt: 1,
                  p: 1,
                  border: '1px solid #40585f',
                  borderRadius: '10px',
                  bgcolor: '#16272f',
                  '& .Mui-disabled': { color: '#adb5bd' },
                }}
                control={
                  <Checkbox
                    sx={{
                      color: '#b0c1c5',
                      mr: 1,
                      '&.Mui-checked': { color: '#a7ecdb' },
                      // Override the lobby's compact icon size for these controls.
                      '& .MuiSvgIcon-root': { width: 28, height: 28 },
                    }}
                    checked={state.draft![field]}
                    disabled={!state.editable}
                    onChange={(event) =>
                      controller.changeType(field, event.target.checked)
                    }
                  />
                }
              />
            ))}
          </Box>
          <Typography variant="body2">
            If no song types are checked, all types are included.
          </Typography>
          <Typography variant="body2">No repeated anime.</Typography>
          {isReady && (
            <Typography variant="body2">
              {isRematch
                ? 'Click Not ready above to edit preferences.'
                : 'Return to the lobby and click Not ready to edit preferences.'}
            </Typography>
          )}
          {state.error && (
            <Alert
              severity="warning"
              action={<Button onClick={controller.retry}>Retry</Button>}
            >
              {state.error}
            </Alert>
          )}
        </>
      ) : (
        <>
          <Typography>
            {state.draft.amount} songs · {songTypes(state.draft)} · No repeated
            anime
          </Typography>
          <Typography>Only the host can change these settings.</Typography>
        </>
      )}
    </Stack>
  );
}
