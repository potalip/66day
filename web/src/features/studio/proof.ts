/** Link a finished video to a course task as proof (learn API: POST /api/progress/day/:day/task/:taskId { url }). */
import type { Lang } from "./api";

export interface ProofTarget { day: number; taskId: string; title: string }

async function get(path: string): Promise<any> {
  try { const r = await fetch(`/api${path}`, { credentials: "include" }); return r.ok ? await r.json() : null; } catch { return null; }
}

/** Open tasks (not done yet) that take a link as proof, on the student's current day. Empty when unavailable. */
export async function loadProofTargets(lang: Lang): Promise<ProofTarget[]> {
  const ov = await get(`/progress?lang=${lang}`);
  const day = Number(ov?.nextDay);
  if (!ov?.onboarded || !day) return [];
  const dv = await get(`/progress/day/${day}?lang=${lang}`);
  if (dv?.access !== "open") return [];          // pacing: tomorrow's day isn't open yet
  const tasks: any[] = dv?.day?.tasks ?? [];
  const states: Record<string, { done?: boolean }> = dv?.tasks ?? {};
  return tasks.filter((t) => t.proof === "link" && !states[t.id]?.done).map((t) => ({ day, taskId: String(t.id), title: String(t.title) }));
}

export async function submitProof(lang: Lang, t: ProofTarget, url: string): Promise<boolean> {
  try {
    const r = await fetch(`/api/progress/day/${t.day}/task/${encodeURIComponent(t.taskId)}?lang=${lang}`, {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }),
    });
    return r.ok;
  } catch { return false; }
}
