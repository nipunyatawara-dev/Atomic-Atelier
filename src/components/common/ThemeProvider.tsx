"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "atomic-atelier-theme";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  mode: "system",
  setMode: () => {},
  toggleTheme: () => {},
});

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "dark" ? "#0c1514" : "#132f31");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      const initialMode: ThemeMode =
        saved === "light" || saved === "dark" || saved === "system"
          ? saved
          : "system";
      const resolvedTheme: Theme =
        initialMode === "system" ? getSystemTheme() : initialMode;

      setModeState(initialMode);
      setThemeState(resolvedTheme);
      applyTheme(resolvedTheme);
    } catch {
      const fallback = getSystemTheme();
      setThemeState(fallback);
      applyTheme(fallback);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || mode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      const nextTheme: Theme = e.matches ? "dark" : "light";
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mounted, mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore localStorage errors in restricted contexts
    }
    const resolved: Theme =
      newMode === "system" ? getSystemTheme() : newMode;
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setMode(nextTheme);
  }, [theme, setMode]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      mode,
      setMode,
      toggleTheme,
    }),
    [theme, mode, setMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
