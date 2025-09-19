import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cloud_guard_theme";
const DEFAULT_THEME = "light";
const THEMES = [
  { id: "light", label: "Light", description: "Clean and bright" },
  { id: "blue", label: "Azure Blue", description: "Professional blue theme" },
  { id: "teal", label: "Ocean Teal", description: "Calming teal waters" },
  { id: "rose", label: "Sunset Rose", description: "Warm rose gradient" },
  { id: "amber", label: "Golden Amber", description: "Rich golden tones" },
  { id: "purple", label: "Royal Purple", description: "Luxurious purple radiance" },
  { id: "emerald", label: "Emerald Green", description: "Fresh emerald vibes" },
  { id: "crimson", label: "Crimson Red", description: "Bold crimson energy" },
];

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_THEME;
    }
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme: setThemeState, themes: THEMES }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
