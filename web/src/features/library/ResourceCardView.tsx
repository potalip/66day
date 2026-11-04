// OWNER: library agent.
import { Link } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { strings } from "./strings";
import type { ResourceCard } from "./types";
import { Pill, Thumb, TypeIcon, ClockIcon, cx, hostOf } from "./ui";

export function ResourceCardView({ r, compact }: { r: ResourceCard; compact?: boolean }) {
  const s = useStrings(strings);
  const lang = useLang();
  const foreign = r.origLang !== lang && r.origLang !== "other";
  return (
    <Link
      to={`/${lang}/library/${r.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-surface transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Thumb src={r.thumbnailUrl} type={r.sourceType} label={r.title} host={r.sourceType === "upload" ? "FlowLeaf" : hostOf(r.url)} />
      <div className={cx("flex flex-1 flex-col gap-2", compact ? "p-3" : "p-4")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><TypeIcon type={r.sourceType} className="size-3.5" />{s.type[r.sourceType]}</span>
          {r.estMinutes ? <span className="inline-flex items-center gap-1"><ClockIcon className="size-3.5" />{s.minutes(r.estMinutes)}</span> : null}
          <span>{s.level[r.level]}</span>
        </div>
        <h3 className={cx("font-semibold leading-snug tracking-tight text-fg", compact ? "line-clamp-2 text-sm" : "line-clamp-2 text-base")}>{r.title}</h3>
        {!compact && r.hook && <p className="line-clamp-2 text-sm text-muted">{r.hook}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {r.author && <span className="mr-auto truncate text-xs text-muted">{r.author}</span>}
          {foreign && <Pill>{r.origLang === "en" ? s.inEnglish : s.inRussian}</Pill>}
          {r.hasLesson && <Pill tone="accent">{s.lessonBadge}</Pill>}
        </div>
      </div>
    </Link>
  );
}
