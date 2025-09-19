import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cloud_guard_theme";
const DEFAULT_THEME = "light";
const THEMES = [
  { id: "light", label: "Polar Dawn" },
  { id: "midnight", label: "Midnight Pulse" },
  { id: "aurora", label: "Aurora" },
  { id: "blue", label: "Arctic Sky" },
  { id: "teal", label: "Lagoon" },
  { id: "rose", label: "Coral Reef" },
  { id: "amber", label: "Solar Flare" },
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
