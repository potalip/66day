// OWNER: learn. Lesson renderer: markdown AST → React elements (no innerHTML → no XSS).
// Why not @web/ui <Markdown>? Lessons need tables, nested + task lists, <details> answers, copyable prompts and
// "**Label:**" callouts, which the kit's parser doesn't cover. Typography matches the kit's `.prose-fl` values.
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { parseMarkdown, type Block, type CalloutKind, type Inline } from "./markdown";
import { Icon, cx } from "./ui";

function renderInline(nodes: Inline[], key = ""): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}${i}`;
    switch (n.t) {
      case "text": return <Fragment key={k}>{n.v}</Fragment>;
      case "br": return <br key={k} />;
      case "code": return <code key={k} className="rounded-md border border-line bg-surface-2 px-[0.35em] py-[0.1em] font-mono text-[0.875em] break-words">{n.v}</code>;
      case "strong": return <strong key={k} className="font-[650] text-fg">{renderInline(n.c, k)}</strong>;
      case "em": return <em key={k}>{renderInline(n.c, k)}</em>;
      case "del": return <del key={k} className="text-muted">{renderInline(n.c, k)}</del>;
      case "img": return <img key={k} src={n.src} alt={n.alt} loading="lazy" className="my-2 inline-block max-h-[480px] max-w-full rounded-[var(--radius)] border border-line" />;
      case "link": {
        const external = /^https?:/i.test(n.href);
        return (
          <a key={k} href={n.href} className="text-accent-ink underline decoration-accent/45 decoration-1 underline-offset-[3px] hover:decoration-accent break-words"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {renderInline(n.c, k)}
          </a>
        );
      }
    }
  });
}

function CodeBlock({ code, lang, copyLabel, copiedLabel }: { code: string; lang: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: the text is still selectable */ }
  };
  return (
    <div className="my-5 overflow-hidden rounded-[var(--radius-sm)] border border-line bg-surface-2">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-1 text-xs text-muted">
        <span className="font-mono">{lang || "prompt"}</span>
        <button type="button" onClick={copy} aria-live="polite"
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 font-medium hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-ring">
          {copied ? <Icon.check size={14} /> : <Icon.copy size={14} />}{copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[0.875rem] leading-relaxed"><code className="font-mono whitespace-pre-wrap break-words">{code}</code></pre>
    </div>
  );
}

const calloutStyle: Record<CalloutKind, { box: string; icon: ReactNode }> = {
  tip: { box: "bg-accent-soft", icon: <Icon.tip className="text-accent-ink" /> },
  note: { box: "bg-info-soft", icon: <Icon.info className="text-info" /> },
  warn: { box: "bg-gold-soft", icon: <Icon.alert className="text-gold-ink" /> },
  stuck: { box: "bg-surface-2", icon: <Icon.stuck className="text-muted" /> },
};

type Labels = { copy: string; copied: string };

function renderBlocks(blocks: Block[], labels: Labels, key = "", tight = false): ReactNode[] {
  return blocks.map((b, i) => {
    const k = `${key}${i}`;
    switch (b.t) {
      case "h": {
        const cls = {
          1: "mt-10 mb-3 text-[1.5rem] leading-tight font-[650] tracking-tight",
          2: "mt-10 mb-3 text-[1.375rem] leading-tight font-[650] tracking-tight",
          3: "mt-8 mb-2 text-[1.1875rem] leading-snug font-[620]",
          4: "mt-6 mb-2 text-base font-[620]",
        }[b.level];
        const Tag = (`h${Math.min(4, b.level + 1)}`) as "h2" | "h3" | "h4"; // the page owns the h1
        return <Tag key={k} id={b.id} className={cx(cls, "scroll-mt-24 first:mt-0 text-balance")}>{renderInline(b.c, k)}</Tag>;
      }
      case "p": return <p key={k} className={tight ? "my-1" : "my-4"}>{renderInline(b.c, k)}</p>;
      case "hr": return <hr key={k} className="my-8 border-line" />;
      case "code": return <CodeBlock key={k} code={b.v} lang={b.lang} copyLabel={labels.copy} copiedLabel={labels.copied} />;
      case "details":
        return (
          <details key={k} className="group my-5 rounded-[var(--radius-sm)] border border-line bg-surface open:bg-surface">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 font-medium select-none hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-90" />
              {renderInline(b.summary, k)}
            </summary>
            <div className="border-t border-line px-4 py-1">{renderBlocks(b.c, labels, k)}</div>
          </details>
        );
      case "list": {
        const isChecklist = b.items.some((it) => it.checked !== null);
        const items = b.items.map((it, j) => (
          <li key={j} className={cx(isChecklist ? "flex list-none gap-2.5" : "pl-1")}>
            {isChecklist && (
              <span className={cx("mt-[0.3em] grid size-[1.05em] shrink-0 place-items-center rounded-[5px] border",
                it.checked ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface")} aria-hidden="true">
                {it.checked && <Icon.check size={11} strokeWidth={3} />}
              </span>
            )}
            <div className="min-w-0">{renderBlocks(it.c, labels, `${k}-${j}-`, true)}</div>
          </li>
        ));
        if (isChecklist) return <ul key={k} className="my-4 space-y-1.5 rounded-[var(--radius-sm)] bg-surface-2/60 px-4 py-3">{items}</ul>;
        return b.ordered
          ? <ol key={k} start={b.start} className="my-4 list-decimal space-y-1.5 pl-6 marker:text-muted">{items}</ol>
          : <ul key={k} className="my-4 list-disc space-y-1.5 pl-6 marker:text-muted">{items}</ul>;
      }
      case "quote": {
        if (b.callout) {
          const st = calloutStyle[b.callout];
          return (
            <aside key={k} className={cx("my-6 flex gap-3 rounded-[var(--radius-sm)] px-4 py-3.5", st.box)}>
              <span className="mt-[0.2em] shrink-0">{st.icon}</span>
              <div className="min-w-0 [&>p]:my-1">{renderBlocks(b.c, labels, k, true)}</div>
            </aside>
          );
        }
        return <blockquote key={k} className="my-6 border-l-[3px] border-accent py-0.5 pl-4 text-muted">{renderBlocks(b.c, labels, k, true)}</blockquote>;
      }
      case "table":
        return (
          <div key={k} className="my-6 overflow-x-auto rounded-[var(--radius-sm)] border border-line" tabIndex={0} role="region" aria-label="table">
            <table className="w-full min-w-[28rem] border-collapse text-[0.9375rem]">
              <thead className="bg-surface-2">
                <tr>{b.head.map((h, j) => <th key={j} className="px-3 py-2 text-left font-[620] text-muted" style={{ textAlign: b.align[j] ?? undefined }}>{renderInline(h, `${k}h${j}`)}</th>)}</tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j} className="border-t border-line">
                    {r.map((c, m) => <td key={m} className="px-3 py-2 align-top" style={{ textAlign: b.align[m] ?? undefined }}>{renderInline(c, `${k}r${j}c${m}`)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  });
}

export function Markdown({ source, copyLabel, copiedLabel, className }: { source: string; copyLabel: string; copiedLabel: string; className?: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source]);
  return (
    <div className={cx("max-w-[68ch] text-[1.0625rem] leading-[1.7] text-fg [overflow-wrap:anywhere] sm:[overflow-wrap:normal]", className)}>
      {renderBlocks(blocks, { copy: copyLabel, copied: copiedLabel })}
    </div>
  );
}
