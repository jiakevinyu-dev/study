"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      suppressHydrationWarning
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-fg/70 transition-colors hover:border-border-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Sun
        className="absolute h-4 w-4 scale-100 opacity-100 transition-all duration-300 dark:scale-0 dark:opacity-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute h-4 w-4 scale-0 opacity-0 transition-all duration-300 dark:scale-100 dark:opacity-100"
        aria-hidden="true"
      />
    </button>
  );
}
