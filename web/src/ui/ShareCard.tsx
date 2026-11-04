import { useMemo, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { useStrings } from "@web/i18n";
import onestLatin from "@fontsource-variable/onest/files/onest-latin-wght-normal.woff2?url";
import onestCyr from "@fontsource-variable/onest/files/onest-cyrillic-wght-normal.woff2?url";
import serifLatin from "@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2?url";
import serifCyr from "@fontsource-variable/source-serif-4/files/source-serif-4-cyrillic-wght-italic.woff2?url";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Segmented } from "./Tabs";
import { useToast } from "./Toast";
import { cn } from "./cn";
import { SHARE_SIZES, shareCardSvg, shareText, type ShareCardData, type ShareFormat, type ShareTheme } from "./shareCardSvg";

export type { ShareCardData, ShareFormat, ShareTheme } from "./shareCardSvg";

/** Inline SVG preview of the card. It scales to its container width; aspect ratio is kept. */
export function ShareCard({ data, format = "portrait", theme = "light", className }: {
  data: ShareCardData; format?: ShareFormat; theme?: ShareTheme; className?: string;
}) {
  const svg = useMemo(() => shareCardSvg(data, format, theme), [data, format, theme]);
  const { w, h } = SHARE_SIZES[format];
  return (
    <div role="img" aria-label={shareText(data)}
      className={cn("overflow-hidden rounded-[var(--radius)] border border-line shadow-card [&>svg]:block [&>svg]:h-auto [&>svg]:w-full", className)}
      style={{ aspectRatio: `${w} / ${h}` }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

// ---------- export ----------
let fontCssPromise: Promise<string> | null = null;
async function toDataUrl(url: string) {
  const blob = await (await fetch(url)).blob();
  return await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); });
}
/** Fonts are fetched + base64-embedded only on the first export (~150 kB), never on page load. */
function embeddedFonts(): Promise<string> {
  fontCssPromise ??= (async () => {
    const [a, b, c, d] = await Promise.all([onestLatin, onestCyr, serifLatin, serifCyr].map(toDataUrl));
    const cyr = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116";
    return `@font-face{font-family:'Onest Variable';font-weight:100 900;src:url(${a}) format('woff2')}` +
      `@font-face{font-family:'Onest Variable';font-weight:100 900;src:url(${b}) format('woff2');unicode-range:${cyr}}` +
      `@font-face{font-family:'Source Serif 4 Variable';font-style:italic;font-weight:200 900;src:url(${c}) format('woff2')}` +
      `@font-face{font-family:'Source Serif 4 Variable';font-style:italic;font-weight:200 900;src:url(${d}) format('woff2');unicode-range:${cyr}}`;
  })().catch((e) => { fontCssPromise = null; throw e; });
  return fontCssPromise;
}

/** Render the card to a PNG Blob, client-side (SVG → <img> → canvas). Falls back to system fonts if fonts can't load. */
export async function renderShareCardPng(data: ShareCardData, format: ShareFormat = "portrait", theme: ShareTheme = "light"): Promise<Blob> {
  const { w, h } = SHARE_SIZES[format];
  const css = await embeddedFonts().catch(() => "");
  const svg = shareCardSvg(data, format, theme, css);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("svg render failed")); img.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("no canvas");
    g.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function shareFileName(data: ShareCardData, format: ShareFormat) {
  return `flowleaf66-${data.kind === "streak" ? `streak-${data.streak ?? 0}` : `day-${data.day}`}-${format === "portrait" ? "1080x1350" : "1200x630"}.png`;
}

function download(blob: Blob, name: string) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/**
 * Share via the OS share sheet when it accepts files (phones), otherwise download the PNG.
 * Returns what happened so the caller can toast.
 */
export async function shareOrDownload(data: ShareCardData, format: ShareFormat = "portrait", theme: ShareTheme = "light"): Promise<"shared" | "downloaded" | "cancelled"> {
  const blob = await renderShareCardPng(data, format, theme);
  const name = shareFileName(data, format);
  const file = new File([blob], name, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text: shareText(data) }); return "shared"; }
    catch (e) { if ((e as DOMException)?.name === "AbortError") return "cancelled"; }
  }
  download(blob, name);
  return "downloaded";
}

// ---------- dialog ----------
const S = {
  en: {
    title: "Share your progress", desc: "Posting your progress is part of the program — it's how the habit sticks.",
    format: "Format", portrait: "Post 4:5", landscape: "Link 1.91:1", theme: "Card theme", light: "Light", dark: "Dark",
    share: "Share image", download: "Download PNG", copy: "Copy text", copied: "Text copied", saved: "Image saved",
    savedD: "Post it with the text — it's already in your clipboard.", fail: "Couldn't create the image", failD: "Try again, or take a screenshot of the preview.",
  },
  ru: {
    title: "Поделись прогрессом", desc: "Публиковать прогресс — часть программы: так привычка держится крепче.",
    format: "Формат", portrait: "Пост 4:5", landscape: "Ссылка 1.91:1", theme: "Тема карточки", light: "Светлая", dark: "Тёмная",
    share: "Поделиться", download: "Скачать PNG", copy: "Скопировать текст", copied: "Текст скопирован", saved: "Картинка сохранена",
    savedD: "Опубликуй её вместе с текстом — он уже в буфере обмена.", fail: "Не получилось создать картинку", failD: "Попробуй ещё раз или сделай скриншот превью.",
  },
};

/**
 * Drop-in share flow: preview + format/theme switch + Share (OS sheet) / Download / Copy text.
 * <ShareDialog open={open} onClose={() => setOpen(false)} data={{ kind: "day", lang, day: 12, title, streak: 9, xp: 1240, name, track }} />
 */
export function ShareDialog({ open, onClose, data, defaultFormat = "portrait" }: {
  open: boolean; onClose: () => void; data: ShareCardData; defaultFormat?: ShareFormat;
}) {
  const s = useStrings(S);
  const { toast } = useToast();
  const [format, setFormat] = useState<ShareFormat>(defaultFormat);
  const [theme, setTheme] = useState<ShareTheme>("light");
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const canShareFiles = typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;
  const text = shareText(data);

  const copy = async (quiet = false) => {
    try { await navigator.clipboard.writeText(text); if (!quiet) toast({ title: s.copied, tone: "success" }); return true; } catch { return false; }
  };
  const run = async (mode: "share" | "download") => {
    setBusy(mode);
    try {
      if (mode === "share") {
        const r = await shareOrDownload(data, format, theme);
        if (r === "downloaded") { await copy(true); toast({ title: s.saved, description: s.savedD, tone: "success" }); }
      } else {
        const blob = await renderShareCardPng(data, format, theme);
        download(blob, shareFileName(data, format));
        await copy(true);
        toast({ title: s.saved, description: s.savedD, tone: "success" });
      }
    } catch {
      toast({ title: s.fail, description: s.failD, tone: "error" });
    } finally { setBusy(null); }
  };

  return (
    <Dialog open={open} onClose={onClose} title={s.title} description={s.desc} size="lg"
      footer={<>
        <Button variant="ghost" icon={<Copy />} onClick={() => copy()}>{s.copy}</Button>
        {canShareFiles && <Button variant="outline" icon={<Download />} loading={busy === "download"} onClick={() => run("download")}>{s.download}</Button>}
        <Button icon={canShareFiles ? <Share2 /> : <Download />} loading={busy === "share"} onClick={() => run(canShareFiles ? "share" : "download")}>
          {canShareFiles ? s.share : s.download}
        </Button>
      </>}>
      <div className="grid gap-5 sm:grid-cols-[1fr_200px] sm:items-start">
        <div className={cn("mx-auto w-full", format === "portrait" ? "max-w-[340px]" : "max-w-[520px]")}>
          <ShareCard data={data} format={format} theme={theme} />
        </div>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">{s.format}</span>
            <Segmented<ShareFormat> label={s.format} value={format} onChange={setFormat} size="sm"
              options={[{ value: "portrait", label: s.portrait }, { value: "landscape", label: s.landscape }]} />
          </div>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">{s.theme}</span>
            <Segmented<ShareTheme> label={s.theme} value={theme} onChange={setTheme} size="sm"
              options={[{ value: "light", label: s.light }, { value: "dark", label: s.dark }]} />
          </div>
          <p className="rounded-[var(--radius-sm)] bg-surface-2 px-3 py-2.5 text-sm text-muted">{text}</p>
        </div>
      </div>
    </Dialog>
  );
}
