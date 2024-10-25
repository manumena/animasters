import React from 'react';
import { Route, Routes } from "react-router-dom"
import Home from './pages/Home';
import "./styles.css"
import Pochita from './pages/Pochita';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#f8f9fa'
    },
    secondary: {
      main: '#86b7fe'
    }
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
          "&.Mui-disabled": { 
            opacity: 0.48, 
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main
          },
          "&:hover": {
            color: theme.palette.secondary.main,
            borderColor: theme.palette.secondary.main,
            boxShadow: '0 0 0 .25rem #0d6efd40',
            outline: 0
          }
        })
      }
    }
  }
});


function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className='main-container'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pochita" element={<Pochita />} />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App;
