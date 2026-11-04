import { useT } from "@web/i18n";

// OWNER: see docs/OWNERSHIP.md
export default function Profile() {
  const t = useT();
  return <div className="rounded-[var(--radius)] border border-line bg-surface p-8"><h1 className="text-2xl font-semibold">Profile</h1><p className="mt-2 text-muted">{t.shell.comingSoon}</p></div>;
}
