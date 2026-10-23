import { Button, InputBase } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ScreenContainer = styled('div')({
  textAlign: 'center',
  position: 'absolute',
  width: 600,
  top: '20%',
  left: '50%',
  transform: 'translate(-50%)',
});

export const SideButton = styled(Button)({
  marginLeft: 5,
  position: 'absolute',
  padding: '5px 15px',
  width: 46,
  height: 38,
  minWidth: 0,
});

// Match the existing compact, transparent player-name field.
export const PlayerNameInput = styled(InputBase)({
  width: 200,
  height: 38,
  marginBottom: 5,
  padding: '6px 12px',
  verticalAlign: 'top',
  border: '1px solid #dee2e6',
  borderRadius: 6,
  backgroundColor: 'transparent',
  color: 'aliceblue',
  fontFamily: 'inherit',
  fontSize: '1rem',
  lineHeight: 1.5,
  transition: 'border-color .15s ease-in-out, box-shadow .15s ease-in-out',
  '&.Mui-focused': {
    borderColor: '#86b7fe',
    boxShadow: '0 0 0 .25rem rgba(13, 110, 253, .25)',
  },
  '& .MuiInputBase-input': {
    padding: 0,
    height: 24,
    boxSizing: 'border-box',
    color: 'aliceblue',
    caretColor: 'aliceblue',
    '&::placeholder': { color: 'aliceblue', opacity: 1 },
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
});

// Preserve the appearance and hover/focus treatment of the original game buttons.
const StyledGameButton = styled(Button)({
  display: 'inline-block',
  minWidth: 0,
  padding: '6px 12px',
  border: '1px solid #f8f9fa',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: '1rem',
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 'normal',
  color: '#f8f9fa',
  backgroundColor: 'transparent',
  transition: 'color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out',
  '&:hover, &:active': {
    color: '#000',
    backgroundColor: '#f8f9fa',
    borderColor: '#f8f9fa',
    boxShadow: 'none',
  },
  '&:focus-visible': {
    color: '#000',
    backgroundColor: '#f8f9fa',
    borderColor: '#f8f9fa',
    boxShadow: '0 0 0 .25rem rgba(248, 249, 250, .5)',
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
});

export function GameButton(props: ButtonProps) {
  return <StyledGameButton variant="outlined" disableRipple {...props} />;
}
