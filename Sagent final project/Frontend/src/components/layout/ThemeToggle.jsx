import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ sidebar = false }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const icon = isDarkMode ? '☀️' : '🌙';
  const nextModeLabel = isDarkMode ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={`btn btn-outline btn-small theme-toggle ${sidebar ? 'is-sidebar' : 'is-navbar'}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextModeLabel} mode`}
      title={`Switch to ${nextModeLabel} mode`}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
};

export default ThemeToggle;
