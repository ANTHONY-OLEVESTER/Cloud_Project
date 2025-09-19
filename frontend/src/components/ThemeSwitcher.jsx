import { useTheme } from "../context/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="theme-switcher" title="Choose color scheme">
      <label htmlFor="theme-select">Theme</label>
      <select
        id="theme-select"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className="theme-selector-enhanced"
      >
        {themes.map((option) => (
          <option key={option.id} value={option.id} title={option.description}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
