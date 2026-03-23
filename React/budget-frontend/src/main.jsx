import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App.jsx';
import { ActiveUserProvider } from './context/ActiveUserContext';
import './styles.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1f5aa6'
    },
    secondary: {
      main: '#f57c00'
    },
    background: {
      default: '#f4f7fb'
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: 'Manrope, sans-serif',
    h4: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 700
    },
    h5: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 700
    },
    h6: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 700
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ActiveUserProvider>
        <App />
      </ActiveUserProvider>
    </ThemeProvider>
  </StrictMode>
);
