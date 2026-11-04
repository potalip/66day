import { Monitor, Moon, Sun } from "lucide-react";
import { useStrings } from "@web/i18n";
import { uiStrings } from "./strings";
import { useResolvedTheme, useTheme, type Theme } from "./theme";
import { Segmented } from "./Tabs";
import { cn } from "./cn";

/**
 * variant "segmented": three icon buttons (System / Light / Dark) — for settings & footer.
 * variant "icon": one button that flips light ↔ dark (from whatever is on screen) — for tight headers.
 */
export function ThemeToggle({ variant = "segmented", className }: { variant?: "segmented" | "icon"; className?: string }) {
  const s = useStrings(uiStrings);
  const [theme, setTheme] = useTheme();
  const resolved = useResolvedTheme();
  if (variant === "icon") {
    const next: Theme = resolved === "dark" ? "light" : "dark";
    return (
      <button type="button" onClick={() => setTheme(next)} aria-label={`${s.theme.label}: ${s.theme[next]}`} title={s.theme[next]}
        className={cn("grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring", className)}>
        {resolved === "dark" ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
      </button>
    );
  }
  return (
    <Segmented<Theme> label={s.theme.label} value={theme} onChange={setTheme} size="sm" className={className}
      options={[
        { value: "system", label: null, icon: <Monitor aria-hidden />, title: s.theme.system },
        { value: "light", label: null, icon: <Sun aria-hidden />, title: s.theme.light },
        { value: "dark", label: null, icon: <Moon aria-hidden />, title: s.theme.dark },
      ]} />
  );
}
