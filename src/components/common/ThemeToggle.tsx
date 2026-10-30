"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

type Props = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className = "", showLabel = false }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun size={17} aria-hidden="true" className="theme-icon sun-icon" />
      ) : (
        <Moon size={17} aria-hidden="true" className="theme-icon moon-icon" />
      )}
      {showLabel && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
