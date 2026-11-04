import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem("fl-theme") as Theme) || "system"; } catch { return "system"; }
  });
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") { delete el.dataset.theme; try { localStorage.removeItem("fl-theme"); } catch {} }
    else { el.dataset.theme = theme; try { localStorage.setItem("fl-theme", theme); } catch {} }
  }, [theme]);
  return [theme, setTheme] as const;
}
