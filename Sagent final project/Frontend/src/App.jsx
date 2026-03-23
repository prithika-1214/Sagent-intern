import { ToastProvider } from './components/common/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './router';

const App = () => (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
);

export default App;
