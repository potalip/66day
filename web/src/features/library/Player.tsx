// OWNER: library agent. YouTube (click-to-load, privacy-enhanced), Instagram (link card + optional embed), uploads, links.
import { useState } from "react";
import { useStrings } from "@web/i18n";
import { strings } from "./strings";
import type { ResourceDetail } from "./types";
import { ArrowIcon, Button, Card, PlayIcon, Thumb, TypeIcon, hostOf } from "./ui";

export function Player({ r, title }: { r: ResourceDetail["resource"]; title: string }) {
  const s = useStrings(strings);
  const [on, setOn] = useState(false);

  if (r.sourceType === "youtube" && r.embedUrl) {
    return (
      <div className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface-2">
        {on ? (
          <iframe
            className="aspect-video w-full" src={`${r.embedUrl}${r.embedUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`} title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group relative block w-full text-left" aria-label={`${s.watchOn("YouTube")}: ${title}`}>
            <Thumb src={r.thumbnailUrl} type="youtube" label={title} />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform group-hover:scale-105"><PlayIcon className="size-9" /></span>
            </span>
          </button>
        )}
      </div>
    );
  }

  if (r.sourceType === "upload" && r.embedUrl) {
    return <video className="aspect-video w-full rounded-[var(--radius)] border border-line bg-surface-2" src={r.embedUrl} controls preload="metadata" poster={r.thumbnailUrl ?? undefined} />;
  }

  if (r.sourceType === "instagram") {
    return (
      <Card className="overflow-hidden">
        {on && r.embedUrl ? (
          <iframe className="mx-auto block h-[640px] w-full max-w-[420px] bg-surface" src={r.embedUrl} title={title} allowFullScreen loading="lazy" />
        ) : (
          <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><TypeIcon type="instagram" className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">Instagram</div>
              <p className="text-sm text-muted">{s.instagramNote}</p>
            </div>
            <div className="flex gap-2">
              {r.embedUrl && <Button size="sm" onClick={() => setOn(true)}><PlayIcon className="size-4" />{s.showEmbed}</Button>}
              {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:opacity-90">{s.watchOn("Instagram")}<ArrowIcon dir="up-right" className="size-4" /></a>}
            </div>
          </div>
        )}
      </Card>
    );
  }

  // Article / docs link
  return (
    <a href={r.url ?? "#"} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-[var(--radius)] border border-line bg-surface p-5 transition-colors hover:border-accent/50">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><TypeIcon type="link" className="size-6" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{hostOf(r.url)}</span>
        <span className="block truncate text-sm text-muted">{r.url}</span>
      </span>
      <span className="hidden items-center gap-1.5 text-sm font-medium text-accent sm:inline-flex">{s.readOn(hostOf(r.url))}<ArrowIcon dir="up-right" className="size-4" /></span>
      <ArrowIcon dir="up-right" className="size-5 text-accent sm:hidden" />
    </a>
  );
}
