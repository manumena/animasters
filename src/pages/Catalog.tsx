import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Link, Typography } from '@mui/material';
import AnimeAutocomplete from '../components/AnimeAutocomplete';
import type { AnimeOption } from '../catalog/types';

export default function Catalog() {
  const [selected, setSelected] = useState<AnimeOption | null>(null);
  return (
    <Box
      component="main"
      sx={{ width: 'min(640px, 100%)', mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 8 } }}
    >
      <Button component={RouterLink} to="/" variant="outlined" sx={{ mb: 4 }}>
        Back to game
      </Button>
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: '#101820e6',
          borderRadius: 2,
          border: '1px solid #ffffff33',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          Anime catalog
        </Typography>
        <Typography sx={{ mb: 3, color: '#d5dbe1' }}>
          Find TV and web series by title, alternate name, or season.
        </Typography>
        <AnimeAutocomplete value={selected} onChange={setSelected} />
        <Box role="status" aria-live="polite" sx={{ minHeight: 60, pt: 2 }}>
          {selected && (
            <Typography>
              Selected: <strong>{selected.title}</strong>
              {selected.detail && ` (${selected.detail})`}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" component="p" sx={{ mt: 2, color: '#c1c9d2' }}>
          Catalog data:{' '}
          <Link href="https://github.com/manami-project/anime-offline-database" color="inherit">
            Manami
          </Link>
          {' · '}
          <Link href="/catalog/LICENSE.txt" color="inherit">
            ODbL 1.0 / DbCL 1.0
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
