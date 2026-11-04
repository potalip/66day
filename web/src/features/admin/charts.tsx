// OWNER: library agent. Tiny inline-SVG charts for the founder dashboard (no chart deps).
// Colours come from design tokens. Dark mode steps them down (validated: categorical pair passes CVD/contrast checks
// in both themes — accent+info in light; the same mixed 12% toward black in dark).
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@web/ui";

const CHART_CSS = `
.fl-chart{--chart-1:var(--accent);--chart-2:var(--info);--chart-alert:var(--danger)}
:root[data-theme="dark"] .fl-chart{--chart-1:color-mix(in oklab,var(--accent) 88%,black);--chart-2:color-mix(in oklab,var(--info) 88%,black)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .fl-chart{--chart-1:color-mix(in oklab,var(--accent) 88%,black);--chart-2:color-mix(in oklab,var(--info) 88%,black)}}
`;
export function ChartStyles() { return <style>{CHART_CSS}</style>; }

export interface Bar { label: string; value: number; tone?: "default" | "alert" | "muted"; detail?: ReactNode }

/**
 * Vertical bar chart, one series. Bars anchored to the baseline with 4px rounded tops and a 2px gap.
 * Hover/focus shows a tooltip; `tick(i)` decides which x labels to print; a table view sits under a <details>.
 */
export function BarChart({ bars, height = 140, tick, format = String, ariaLabel, tableLabel, columns }: {
  bars: Bar[]; height?: number; tick?: (i: number) => string | null; format?: (v: number) => string; ariaLabel: string;
  tableLabel?: string; columns?: [string, string];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...bars.map((b) => b.value));
  const n = bars.length;
  const W = 1000, H = height, gap = n > 40 ? 2 : 4, bw = (W - gap * (n - 1)) / n;
  const r = Math.min(4, bw / 2);
  const hb = hover !== null ? bars[hover] : null;
  return (
    <div className="fl-chart">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={ariaLabel} className="block h-[var(--h)] w-full overflow-visible"
          style={{ ["--h" as string]: `${H}px` }} onMouseLeave={() => setHover(null)}>
          <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={W} y1={0.5} y2={0.5} stroke="var(--line)" strokeDasharray="3 4" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {bars.map((b, i) => {
            const h = b.value ? Math.max(2, (b.value / max) * (H - 6)) : 0;
            const x = i * (bw + gap), y = H - h;
            const fill = b.tone === "alert" ? "var(--chart-alert)" : b.tone === "muted" ? "var(--line-strong)" : "var(--chart-1)";
            return (
              <g key={i}>
                {h > 0 && <path d={roundedTop(x, y, bw, h, r)} fill={fill} opacity={hover === null || hover === i ? 1 : 0.55} />}
                <rect x={x - gap / 2} y={0} width={bw + gap} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
        {hb && (
          <div role="status" className="pointer-events-none absolute -top-2 z-10 w-max max-w-[min(260px,90%)] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card"
            style={tipPosition((hover! + 0.5) / n)}>
            <div className="font-medium tabular-nums">{hb.label}: {format(hb.value)}</div>
            {hb.detail && <div className="mt-0.5 text-muted">{hb.detail}</div>}
          </div>
        )}
      </div>
      {tick && (
        <div className="relative mt-1.5 h-4 text-[0.6875rem] text-muted tabular-nums" aria-hidden>
          {bars.map((_, i) => { const t = tick(i); return t ? <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((i + 0.5) / n) * 100}%` }}>{t}</span> : null; })}
        </div>
      )}
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-fg">{tableLabel ?? "Table"}</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left tabular-nums" aria-describedby={id}>
            <thead className="sticky top-0 bg-surface-2"><tr><th className="px-2 py-1 font-medium">{columns?.[0] ?? ""}</th><th className="px-2 py-1 text-right font-medium">{columns?.[1] ?? ""}</th></tr></thead>
            <tbody>{bars.map((b, i) => <tr key={i} className="border-t border-line"><td className="px-2 py-1">{b.label}</td><td className="px-2 py-1 text-right text-fg">{format(b.value)}</td></tr>)}</tbody>
          </table>
        </div>
        <span id={id} className="sr-only">{ariaLabel}</span>
      </details>
    </div>
  );
}

/** Keep the tooltip inside the chart: anchor left near the left edge, right near the right edge, centred otherwise. */
function tipPosition(f: number): CSSProperties {
  const left = `${f * 100}%`;
  if (f < 0.25) return { left, transform: "translate(-12px, -100%)" };
  if (f > 0.75) return { left, transform: "translate(calc(-100% + 12px), -100%)" };
  return { left, transform: "translate(-50%, -100%)" };
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/** Two-part (or few-part) horizontal split with a legend that carries the numbers (identity never colour-alone). */
export function SplitBar({ parts, ariaLabel }: { parts: { label: string; value: number; color: 1 | 2 | "muted" }[]; ariaLabel: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const fill = (c: 1 | 2 | "muted") => (c === "muted" ? "var(--line-strong)" : `var(--chart-${c})`);
  const shown = parts.filter((p) => p.value > 0);
  return (
    <div className="fl-chart">
      <div role="img" aria-label={`${ariaLabel}: ${parts.map((p) => `${p.label} ${p.value} (${pct(p.value)}%)`).join(", ")}`} className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-surface-2">
        {shown.map((p) => <span key={p.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.value / Math.max(1, total)) * 100}%`, background: fill(p.color) }} />)}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 rounded-sm")} style={{ background: fill(p.color) }} />
            <span>{p.label}</span>
            <span className="font-medium tabular-nums">{p.value}</span>
            <span className="text-muted tabular-nums">{pct(p.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranked list with inline bars (for top resources). */
export function RankList({ rows, empty }: { rows: { key: string; label: ReactNode; value: number; href?: string }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ol className="fl-chart space-y-2">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-sm">{r.label}</span>
          <span className="text-sm font-medium tabular-nums">{r.value}</span>
          <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: "var(--chart-1)" }} />
          </span>
        </li>
      ))}
    </ol>
  );
}
