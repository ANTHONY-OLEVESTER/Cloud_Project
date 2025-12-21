import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cloud_guard_theme";
const DEFAULT_THEME = "dawn";
const THEMES = [
  { id: "dawn", label: "Dawn Chorus", colors: ["#6366f1", "#22d3ee"] },
  { id: "aurora", label: "Aurora", colors: ["#34d399", "#60a5fa"] },
  { id: "midnight", label: "Midnight", colors: ["#0f172a", "#312e81"] },
  { id: "sunset", label: "Solaris", colors: ["#f97316", "#ec4899"] },
  { id: "forest", label: "Emerald", colors: ["#059669", "#10b981"] },
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
