// OWNER: game agent. Small line-icon set for the game layer (24×24, stroke = currentColor).
import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  seed: <><path d="M12 20c-4 0-6-3-6-7 0-4 3-8 6-9 3 1 6 5 6 9 0 4-2 7-6 7Z" /><path d="M12 20v-8" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>,
  rocket: <><path d="M14 4c3 0 6 3 6 6l-6.5 6.5-6-6L14 4Z" /><path d="m7.5 10.5-3 .5-1.5 2.5 4 .5M13.5 16.5l-.5 3-2.5 1.5-.5-4" /><circle cx="15" cy="9" r="1.4" /><path d="M6 18c-1 0-2 1-2 2 1 0 2-1 2-2Z" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" /></>,
  play: <><rect x="3.5" y="5" width="17" height="14" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></>,
  stack: <><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></>,
  book: <><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5V5.5Z" /><path d="M12 6v13.5" /></>,
  flame: <path d="M12 21c-3.6 0-6-2.4-6-5.6 0-2.6 1.6-4.4 3-6 .4 1.6 1.2 2.6 2.2 3 0-3.3 1.4-6 3.8-8.4.3 3 1.6 4.6 2.8 6.2.8 1.1 1.2 2.3 1.2 3.6C19 18.4 16 21 12 21Z" />,
  leaf: <><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14H5Z" /><path d="M5 19 13 11" /></>,
  snowflake: <><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2M4 11l3 1-.7 3M20 13l-3-1 .7-3M4.6 14.2 7 12M19.4 9.8 17 12" /></>,
  return: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  sunrise: <><path d="M4 18h16M7 18a5 5 0 0 1 10 0" /><path d="M12 4v5M9.5 6.5 12 4l2.5 2.5M4.5 12.5 6 14M19.5 12.5 18 14" /></>,
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5Z" />,
  star: <path d="m12 3.8 2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.8Z" />,
  crown: <><path d="M4 8l4 4 4-7 4 7 4-4-1.5 10h-13L4 8Z" /><path d="M6 21h12" /></>,
  medal: <><circle cx="12" cy="14" r="5.5" /><path d="M8.5 9.5 6 3h4l2 4.5M15.5 9.5 18 3h-4l-2 4.5" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
};

export const ICON_NAMES = Object.keys(P);

export function GameIcon({ name, size = 20, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  const path = P[name];
  if (!path) {
    // Content badges may use an emoji instead of a built-in icon name.
    const isEmoji = /\p{Extended_Pictographic}/u.test(name);
    return isEmoji ? (
      <span aria-hidden style={{ fontSize: size * 0.85, lineHeight: 1 }}>{name}</span>
    ) : (
      <GameIcon name="medal" size={size} {...rest} />
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {path}
    </svg>
  );
}
