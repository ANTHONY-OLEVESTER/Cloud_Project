import { useTheme } from "../context/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Choose a color theme">
      {themes.map((option) => {
        const isActive = option.id === theme;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`theme-switcher__option ${isActive ? "theme-switcher__option--active" : ""}`}
            style={{
              "--theme-color-a": option.colors[0],
              "--theme-color-b": option.colors[1],
            }}
            onClick={() => setTheme(option.id)}
          >
            <span className="theme-switcher__swatch" aria-hidden="true" />
            <span className="theme-switcher__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
