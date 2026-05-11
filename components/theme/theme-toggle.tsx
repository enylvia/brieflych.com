"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={cn(
        "theme-toggle inline-flex h-10 items-center gap-2 rounded-full border border-[#dce3f2] bg-white/90 px-3 text-xs font-bold text-[#4f566d] shadow-[0_14px_30px_-24px_rgba(15,23,42,0.36)] transition-all hover:-translate-y-0.5 hover:bg-white",
        className,
      )}
    >
      <span className="relative flex size-5 items-center justify-center rounded-full bg-[#eef2ff] text-[#4b41e7]">
        {isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </span>
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
