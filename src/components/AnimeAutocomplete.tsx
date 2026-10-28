import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { catalogClient, type CatalogClient } from '../catalog/client';
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, normalizeTerm } from '../catalog/search';
import type { AnimeOption } from '../catalog/types';

interface Props {
  value: AnimeOption | null;
  onChange: (value: AnimeOption | null) => void;
  client?: CatalogClient;
  disabled?: boolean;
}

export default function AnimeAutocomplete({ value, onChange, client = catalogClient, disabled = false }: Props) {
  // React subscribes to loading state; the complete catalog stays in the worker.
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot);
  const [query, setQuery] = useState(value?.title ?? '');
  const [response, setResponse] = useState<{ query: string; options: AnimeOption[] }>({
    query: '',
    options: [],
  });
  const enoughCharacters = [...normalizeTerm(query)].length >= MIN_QUERY_LENGTH;
  const ready = state.phase === 'ready';
  const searching = ready && !value && enoughCharacters && response.query !== query;
  const options =
    ready && !value && enoughCharacters && response.query === query ? response.options : [];

  // Start lazily when search is mounted, and keep the shared worker for later visits.
  useEffect(() => {
    client.start();
  }, [client]);
  // Debounce typing and ignore replies belonging to an older query or unmounted view.
  useEffect(() => {
    if (!ready || !enoughCharacters || value) return;
    let active = true;
    const timer = setTimeout(() => {
      void client.search(query).then((results) => {
        if (active) setResponse({ query, options: results });
      });
    }, 60);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [client, query, ready, enoughCharacters, value]);

  const loadingText =
    state.phase === 'indexing' ? 'Preparing anime search…' : 'Loading anime catalog…';
  return (
    <Box sx={{ width: '100%' }}>
      {state.phase === 'error' ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={client.retry}>
              Retry
            </Button>
          }
        >
          {state.error}
        </Alert>
      ) : (
        !ready && (
          <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={18} color="inherit" />
            {loadingText}
          </Box>
        )
      )}
      <Autocomplete<AnimeOption>
        value={value}
        inputValue={query}
        options={options}
        disabled={!ready || disabled}
        loading={searching}
        loadingText="Searching…"
        noOptionsText={
          enoughCharacters
            ? 'No anime found. Try another title or spelling.'
            : 'Type at least two characters.'
        }
        filterOptions={
          // The worker already filters and ranks aliases; preserve that order.
          (items) => items
        }
        getOptionLabel={(option) => option.title}
        getOptionKey={(option) => option.id}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        onChange={(_, selected) => {
          setQuery(selected?.title ?? '');
          onChange(selected);
        }}
        onInputChange={(_, input, reason) => {
          // Clearing the selected ID while typing makes MUI issue a reset;
          // preserve the user's edited text instead of replacing it with ''.
          if (reason === 'reset') return;
          setQuery(input.slice(0, MAX_QUERY_LENGTH));
          if (reason === 'input' || reason === 'clear') onChange(null);
        }}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              <Box sx={{ minWidth: 0, py: 0.4 }}>
                <Typography sx={{ overflowWrap: 'anywhere' }}>{option.title}</Typography>
                {option.detail && (
                  <Typography variant="body2" color="text.secondary">
                    {option.detail}
                  </Typography>
                )}
                {normalizeTerm(option.matchedAlias) !== normalizeTerm(option.title) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    {option.matchedAlias}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
        slotProps={{
          paper: { sx: { bgcolor: '#f8f9fa', color: '#212529' } },
          listbox: { sx: { maxHeight: 'min(360px, 45vh)' } },
          clearIndicator: { sx: { color: 'inherit' } },
          popupIndicator: { sx: { color: 'inherit' } },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search anime"
            placeholder="Title or alternate name…"
            helperText={
              ready
                ? 'Choose an anime from the suggestions.'
                : 'Search will be available when the catalog is ready.'
            }
            slotProps={{
              ...params.slotProps,
              htmlInput: { ...params.slotProps.htmlInput, maxLength: MAX_QUERY_LENGTH },
              inputLabel: {
                ...params.slotProps.inputLabel,
                sx: { color: '#f8f9fa', '&.Mui-disabled': { color: '#adb5bd' } },
              },
              formHelperText: { sx: { color: '#d5dbe1' } },
            }}
            sx={{ '& .MuiOutlinedInput-root': { color: '#f8f9fa', bgcolor: '#10182099' } }}
          />
        )}
      />
    </Box>
  );
}
