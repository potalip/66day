import { Fragment, useMemo, type ReactNode } from "react";
import { Lightbulb, Info, TriangleAlert } from "lucide-react";
import { cn } from "./cn";
import { parseMarkdown, type Block, type Inline } from "./markdown";

function inl(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text": return <Fragment key={i}>{n.v}</Fragment>;
      case "code": return <code key={i}>{n.v}</code>;
      case "strong": return <strong key={i}>{inl(n.c)}</strong>;
      case "em": return <em key={i}>{inl(n.c)}</em>;
      case "del": return <del key={i}>{inl(n.c)}</del>;
      case "br": return <br key={i} />;
      case "link": {
        const ext = /^https?:/i.test(n.href);
        return <a key={i} href={n.href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inl(n.c)}</a>;
      }
    }
  });
}

const calloutStyle = {
  tip: { cls: "bg-accent-soft", icon: <Lightbulb aria-hidden className="size-[18px] text-accent-ink" /> },
  note: { cls: "bg-info-soft", icon: <Info aria-hidden className="size-[18px] text-info" /> },
  warning: { cls: "bg-gold-soft", icon: <TriangleAlert aria-hidden className="size-[18px] text-gold-ink" /> },
};

function blocks(bs: Block[]): ReactNode {
  return bs.map((b, i) => {
    switch (b.type) {
      case "heading": { const H = `h${b.level}` as "h1"; return <H key={i}>{inl(b.c)}</H>; }
      case "p": return <p key={i}>{inl(b.c)}</p>;
      case "hr": return <hr key={i} />;
      case "img": return <img key={i} src={b.src} alt={b.alt} loading="lazy" />;
      case "code": return <pre key={i} data-lang={b.lang}><code>{b.v}</code></pre>;
      case "quote": return <blockquote key={i}>{blocks(b.c)}</blockquote>;
      case "callout": {
        const s = calloutStyle[b.kind];
        return (
          <div key={i} className={cn("not-prose flex gap-3 rounded-[var(--radius-sm)] px-4 py-3.5", s.cls)}>
            <span className="mt-1 shrink-0">{s.icon}</span>
            <div className="min-w-0 [&>*+*]:mt-2">{blocks(b.c)}</div>
          </div>
        );
      }
      case "list": {
        const L = b.ordered ? "ol" : "ul";
        return (
          <L key={i} start={b.start && b.start !== 1 ? b.start : undefined}>
            {b.items.map((it, j) => <li key={j}>{inl(it.c)}{it.children && blocks([it.children])}</li>)}
          </L>
        );
      }
    }
  });
}

/** Render Markdown safely with FlowLeaf prose styles. size="sm" for cards/side panels. */
export function Markdown({ source, size = "md", className }: { source: string; size?: "sm" | "md"; className?: string }) {
  const tree = useMemo(() => parseMarkdown(source ?? ""), [source]);
  return <div className={cn("prose-fl", size === "sm" && "prose-fl-sm", className)}>{blocks(tree)}</div>;
}

/** Apply prose styles to your own rendered HTML/JSX. */
export function Prose({ children, size = "md", className }: { children: ReactNode; size?: "sm" | "md"; className?: string }) {
  return <div className={cn("prose-fl", size === "sm" && "prose-fl-sm", className)}>{children}</div>;
}
