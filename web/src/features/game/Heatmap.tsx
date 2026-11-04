// OWNER: game agent. 66-day activity heatmap (one square per program day).
import { useLang, useStrings } from "@web/i18n";
import type { ActivityCell } from "./api";
import { fmtDay } from "./format";
import { strings } from "./strings";
import { cx } from "./ui";

const LEVELS = ["bg-surface-2", "bg-accent/25", "bg-accent/50", "bg-accent/75", "bg-accent"];
export function intensity(xp: number) {
  if (xp <= 0) return 0;
  if (xp < 40) return 1;
  if (xp < 90) return 2;
  if (xp < 150) return 3;
  return 4;
}

export function Heatmap({ cells, today }: { cells: ActivityCell[]; today: string }) {
  const s = useStrings(strings);
  const lang = useLang();
  return (
    <div>
      <ol className="grid grid-cols-11 gap-1.5 sm:grid-cols-[repeat(22,minmax(0,1fr))]" aria-label={s.profile.activity}>
        {cells.map((c) => {
          const future = c.day > today;
          const label = `${s.profile.dayN(c.index)} · ${fmtDay(c.day, lang)} · ${future ? s.profile.future : c.xp ? `${c.xp} XP` : s.profile.noXp}`;
          return (
            <li key={c.day} title={label} aria-label={label}
              className={cx(
                "aspect-square rounded-[5px]",
                future ? "border border-dashed border-line" : LEVELS[intensity(c.xp)],
                c.day === today && "ring-2 ring-fg/70 ring-offset-1 ring-offset-surface",
              )} />
          );
        })}
      </ol>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{s.profile.dayN(1)} → {s.profile.dayN(66)}</span>
        <span className="flex items-center gap-1" aria-hidden>
          {s.profile.less}
          {LEVELS.map((l) => <span key={l} className={cx("h-3 w-3 rounded-[3px]", l)} />)}
          {s.profile.more}
        </span>
      </div>
    </div>
  );
}
