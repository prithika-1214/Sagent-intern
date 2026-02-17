import ErrorBoundary from "./components/common/ErrorBoundary";
import AppRouter from "./routes/AppRouter";

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;
