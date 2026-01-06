"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="relative w-10 h-10 rounded-full bg-slate-200/60 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 rounded-full bg-slate-200/60 dark:bg-white/10 backdrop-blur-sm hover:bg-slate-300/70 dark:hover:bg-white/20 transition-all flex items-center justify-center group border border-slate-300/50 dark:border-white/10"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-400 transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 transition-transform group-hover:-rotate-45" />
      )}
    </button>
  );
}
