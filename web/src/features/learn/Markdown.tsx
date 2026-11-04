// OWNER: learn. Renders the markdown AST as React elements (no innerHTML → no XSS).
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { parseMarkdown, type Block, type CalloutKind, type Inline } from "./markdown";
import { Icon, cx } from "./ui";

function renderInline(nodes: Inline[], key = ""): ReactNode[] {
  return nodes.map((n, i) => {
    const k = `${key}${i}`;
    switch (n.t) {
      case "text": return <Fragment key={k}>{n.v}</Fragment>;
      case "br": return <br key={k} />;
      case "code": return <code key={k} className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.88em] break-words">{n.v}</code>;
      case "strong": return <strong key={k} className="font-semibold text-fg">{renderInline(n.c, k)}</strong>;
      case "em": return <em key={k}>{renderInline(n.c, k)}</em>;
      case "del": return <del key={k} className="text-muted">{renderInline(n.c, k)}</del>;
      case "img": return <img key={k} src={n.src} alt={n.alt} loading="lazy" className="my-2 inline-block max-h-[480px] max-w-full rounded-xl border border-line" />;
      case "link": {
        const external = /^https?:/i.test(n.href);
        return (
          <a key={k} href={n.href} className="font-medium text-accent underline decoration-accent/30 underline-offset-[3px] hover:decoration-accent break-words"
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
    } catch { /* clipboard blocked: user can still select the text */ }
  };
  return (
    <div className="group relative my-5 overflow-hidden rounded-xl border border-line bg-surface-2">
      <div className="flex items-center justify-between border-b border-line px-4 py-1.5 text-xs text-muted">
        <span className="font-mono">{lang || "prompt"}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-accent" aria-live="polite">
          {copied ? <Icon.check size={14} /> : <Icon.copy size={14} />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13.5px] leading-relaxed"><code className="font-mono whitespace-pre-wrap break-words">{code}</code></pre>
    </div>
  );
}

const calloutStyle: Record<CalloutKind, { box: string; icon: (p: { size?: number }) => ReactNode }> = {
  tip: { box: "border-accent/30 bg-accent-soft", icon: Icon.sparkle },
  note: { box: "border-line bg-surface-2", icon: Icon.info },
  warn: { box: "border-gold/40 bg-gold-soft", icon: Icon.alert },
};

function renderBlocks(blocks: Block[], labels: { copy: string; copied: string }, key = "", tight = false): ReactNode[] {
  return blocks.map((b, i) => {
    const k = `${key}${i}`;
    switch (b.t) {
      case "h": {
        const cls = {
          1: "mt-10 mb-4 text-2xl font-semibold tracking-tight",
          2: "mt-10 mb-3 text-xl font-semibold tracking-tight first:mt-0",
          3: "mt-8 mb-2 text-lg font-semibold",
          4: "mt-6 mb-2 font-semibold",
        }[b.level];
        const Tag = (`h${Math.min(4, b.level + 1)}`) as "h2" | "h3" | "h4"; // page owns the h1
        return <Tag key={k} id={b.id} className={cx(cls, "scroll-mt-24")}>{renderInline(b.c, k)}</Tag>;
      }
      case "p": return <p key={k} className={tight ? "my-1" : "my-4"}>{renderInline(b.c, k)}</p>;
      case "hr": return <hr key={k} className="my-8 border-line" />;
      case "code": return <CodeBlock key={k} code={b.v} lang={b.lang} copyLabel={labels.copy} copiedLabel={labels.copied} />;
      case "list": {
        const items = b.items.map((it, j) => (
          <li key={j} className={cx("pl-1", it.checked !== null && "list-none -ml-5 flex gap-2")}>
            {it.checked !== null && (
              <span className={cx("mt-1 grid size-4 shrink-0 place-items-center rounded border", it.checked ? "border-accent bg-accent text-accent-fg" : "border-line")} aria-hidden="true">
                {it.checked && <Icon.check size={12} strokeWidth={3} />}
              </span>
            )}
            <div className="min-w-0">{renderBlocks(it.c, labels, `${k}-${j}-`, true)}</div>
          </li>
        ));
        return b.ordered
          ? <ol key={k} start={b.start} className="my-4 list-decimal space-y-1.5 pl-6 marker:font-medium marker:text-muted">{items}</ol>
          : <ul key={k} className="my-4 list-disc space-y-1.5 pl-6 marker:text-accent">{items}</ul>;
      }
      case "quote": {
        if (b.callout) {
          const s = calloutStyle[b.callout];
          return (
            <aside key={k} className={cx("my-6 flex gap-3 rounded-xl border px-4 py-3", s.box)}>
              <span className={cx("mt-1 shrink-0", b.callout === "warn" ? "text-gold" : b.callout === "tip" ? "text-accent" : "text-muted")}>{s.icon({ size: 18 })}</span>
              <div className="min-w-0 [&>p]:my-1">{renderBlocks(b.c, labels, k, true)}</div>
            </aside>
          );
        }
        return <blockquote key={k} className="my-6 border-l-2 border-accent pl-4 text-muted italic">{renderBlocks(b.c, labels, k, true)}</blockquote>;
      }
      case "table":
        return (
          <div key={k} className="my-6 overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-2">
                <tr>{b.head.map((h, j) => <th key={j} className="px-3 py-2 text-left font-semibold" style={{ textAlign: b.align[j] ?? undefined }}>{renderInline(h, `${k}h${j}`)}</th>)}</tr>
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
    <div className={cx("max-w-[70ch] text-[16.5px] leading-[1.7] text-fg/90 [overflow-wrap:anywhere] sm:[overflow-wrap:normal]", className)}>
      {renderBlocks(blocks, { copy: copyLabel, copied: copiedLabel })}
    </div>
  );
}
