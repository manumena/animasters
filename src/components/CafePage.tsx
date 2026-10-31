import type { ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { FiHeadphones } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './CafePage.css';

// All café screens share the homepage palette and its independent artwork frame.
const cafeTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#9ae1d0', contrastText: '#153c32' },
  },
  typography: {
    fontFamily: 'inherit',
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

export function CafeHeader({ children }: { children?: ReactNode } = {}) {
  return (
    <header className="cafe-header">
      <Link to="/" className="cafe-brand" aria-label="AniMasters home">
        <span className="cafe-brand-mark"><FiHeadphones aria-hidden="true" /></span>
        <span>ani<span className="cafe-brand-light">masters</span></span>
        <small>Beta</small>
      </Link>
      {children && <div className="cafe-header-extra">{children}</div>}
    </header>
  );
}

export default function CafePage({ children, className }: { children: ReactNode; className: string }) {
  return (
    <ThemeProvider theme={cafeTheme}>
      <main className={`cafe-page ${className}`}>{children}</main>
    </ThemeProvider>
  );
}
