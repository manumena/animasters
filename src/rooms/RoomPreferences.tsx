import { useState } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import type { RoomSettings } from './client';

interface Props {
  settings?: RoomSettings;
  isHost: boolean;
  connected: boolean;
  canReady: boolean;
  isReady: boolean;
  onSave: (settings: RoomSettings) => void;
  onReady: () => void;
  onUnready: () => void;
}

/** Remounted only when the server's settings revision changes. Clock/presence
 * snapshots leave an unsaved draft intact; server acknowledgement replaces it. */
export default function RoomPreferences(props: Props) {
  if (!props.settings) return <Typography>Loading match settings…</Typography>;
  return <PreferencesForm {...props} settings={props.settings} />;
}

function PreferencesForm({ settings, isHost, connected, canReady, isReady, onSave, onReady, onUnready }: Props & { settings: RoomSettings }) {
  const [amount, setAmount] = useState(String(settings.amount));
  const [draft, setDraft] = useState(settings);
  const count = Number(amount);
  const validCount = amount.trim() !== '' && Number.isInteger(count) && count >= 1 && count <= 999;
  const changed = count !== settings.amount ||
    draft.includeOpenings !== settings.includeOpenings ||
    draft.includeEndings !== settings.includeEndings ||
    draft.includeSoundtracks !== settings.includeSoundtracks;
  const editable = connected && !isReady;
  const types = [
    settings.includeOpenings && 'Openings',
    settings.includeEndings && 'Endings',
    settings.includeSoundtracks && 'Soundtracks',
  ].filter(Boolean);

  return <Stack spacing={2}>
    <Typography component="h2" variant="h6">Match preferences</Typography>
    <Typography>{settings.amount} songs · {types.length ? types.join(', ') : 'All song types'} · No repeated anime</Typography>
    {isHost ? <Stack
      component="form"
      spacing={1}
      onSubmit={event => {
        event.preventDefault();
        if (editable && validCount && changed) onSave({ ...draft, amount: count });
      }}
    >
      <TextField
        label="Songs per match"
        type="number"
        value={amount}
        disabled={!editable}
        error={!validCount}
        helperText={validCount ? 'Choose how many songs to play.' : 'Enter a whole number from 1 to 999.'}
        onChange={event => setAmount(event.target.value)}
        slotProps={{
          htmlInput: { min: 1, max: 999, step: 1 },
          inputLabel: { sx: { color: '#d5dbe1' } },
          formHelperText: { sx: { color: '#d5dbe1' } },
        }}
      />
      <Box>
        {([
          ['includeOpenings', 'Include openings'],
          ['includeEndings', 'Include endings'],
          ['includeSoundtracks', 'Include soundtracks'],
        ] as const).map(([field, label]) => <FormControlLabel
          key={field}
          label={label}
          sx={{ display: 'flex', '& .Mui-disabled': { color: '#adb5bd' } }}
          control={<Checkbox
            sx={{ color: '#c1c9d2' }}
            checked={draft[field]}
            disabled={!editable}
            onChange={event => setDraft({ ...draft, [field]: event.target.checked })}
          />}
        />)}
      </Box>
      <Typography variant="body2">If no song types are checked, all types are included.</Typography>
      <Button type="submit" variant="outlined" disabled={!editable || !validCount || !changed}>Save settings</Button>
      <Typography variant="body2">
        {isReady ? 'Click Not ready to edit preferences.' : changed ? 'Save your changes before becoming ready.' : 'Saving changes clears everyone’s Ready status.'}
      </Typography>
    </Stack> : <Typography>Only the host can change these settings.</Typography>}
    <Typography>Invite your friends before pressing Ready. The match starts when everyone connected is ready.</Typography>
    <Button
      variant="outlined"
      disabled={isReady ? !connected : !canReady || (isHost && (changed || !validCount))}
      onClick={isReady ? onUnready : onReady}
    >
      {isReady ? 'Not ready' : 'Enable audio & Ready'}
    </Button>
    {isReady && <Typography role="status">Ready — waiting for players</Typography>}
  </Stack>;
}
