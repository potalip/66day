import { useState } from "react";
import { cn } from "./cn";

const tones = [
  "bg-accent-soft text-accent-ink",
  "bg-gold-soft text-gold-ink",
  "bg-info-soft text-info",
  "bg-surface-3 text-fg",
  "bg-danger-soft text-danger-ink",
];
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Round avatar: image if `src` loads, otherwise initials on a tone picked deterministically from the name. */
export function Avatar({ name, src, size = 36, ring, className }: { name: string; src?: string | null; size?: number; ring?: "accent" | "gold"; className?: string }) {
  const [broken, setBroken] = useState(false);
  const showImg = src && !broken;
  return (
    <span className={cn(
      "relative inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-semibold",
      !showImg && tones[hash(name) % tones.length],
      ring === "accent" && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
      ring === "gold" && "ring-2 ring-gold-bright ring-offset-2 ring-offset-bg",
      className,
    )} style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }} title={name}>
      {showImg ? <img src={src!} alt={name} className="size-full object-cover" onError={() => setBroken(true)} />
        : <span aria-label={name} role="img">{initials(name)}</span>}
    </span>
  );
}
