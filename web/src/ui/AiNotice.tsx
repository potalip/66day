import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useStrings } from "@web/i18n";
import { cn } from "./cn";

const S = {
  en: { title: "AI isn't configured here yet", body: "We're showing a ready-made example instead, so you can still see how it works." },
  ru: { title: "ИИ здесь пока не подключён", body: "Вместо ответа ИИ показываем готовый пример — чтобы было видно, как всё работает." },
};

/**
 * Standard notice for features that degrade without ANTHROPIC_API_KEY. Put it right above the fallback content.
 * Override copy via title/children when the context needs it.
 */
export function AiNotice({ title, children, className }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  const s = useStrings(S);
  return (
    <div role="note" className={cn("flex gap-3 rounded-[var(--radius-sm)] border border-gold-bright/40 bg-gold-soft px-4 py-3 text-sm", className)}>
      <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-ink" />
      <div className="min-w-0">
        <p className="font-medium text-gold-ink">{title ?? s.title}</p>
        <p className="mt-0.5 text-fg/80">{children ?? s.body}</p>
      </div>
    </div>
  );
}
