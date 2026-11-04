import type { LibLang } from "./schema";
import type { Resource, MaterialState } from "./repo";

/** One row of the founder's batch tracker: where a resource is in the pipeline, as discrete steps. */
export type StepState = "todo" | "active" | "done" | "warn" | "error" | "skip" | "ready";
export interface PipelineStep { key: "fetch" | "transcript" | `lesson_${LibLang}` | "publish"; state: StepState }

export function pipelineSteps(r: Pick<Resource, "status" | "sourceType" | "transcriptState" | "aiState" | "audience">,
  materials: Partial<Record<LibLang, MaterialState>>, seenSteps: Set<string>): PipelineStep[] {
  const fetched = r.sourceType === "upload" || seenSteps.has("metadata");
  const fetch: StepState = r.status === "failed" && !fetched ? "error" : fetched ? "done" : "active";

  const transcript: StepState =
    r.transcriptState === "ready" ? "done"
    : r.transcriptState === "needed" ? "warn"
    : r.transcriptState === "fetching" ? "active"
    : r.transcriptState === "not_applicable" ? "skip"
    : fetched ? "skip" : "todo";

  const lesson = (l: LibLang): StepState => {
    if (!r.audience.includes(l)) return "skip";
    const m = materials[l];
    if (m === "ready") return "done";
    if (m === "queued" || m === "generating") return "active";
    if (m === "failed") return "error";
    if (m === "not_configured") return "warn"; // starter draft — needs the founder (or an API key)
    return fetched ? "todo" : "todo";
  };

  const publish: StepState = r.status === "published" ? "done" : r.status === "review" ? "ready" : "todo";
  return [
    { key: "fetch", state: fetch },
    { key: "transcript", state: transcript },
    { key: "lesson_ru", state: lesson("ru") },
    { key: "lesson_en", state: lesson("en") },
    { key: "publish", state: publish },
  ];
}

/** Short machine reason the founder needs to act, or null when the pipeline is still working / done. */
export function attentionReason(steps: PipelineStep[]): "failed" | "transcript" | "lesson_failed" | "draft" | "review" | null {
  const by = Object.fromEntries(steps.map((s) => [s.key, s.state]));
  if (by.fetch === "error") return "failed";
  if (steps.some((s) => s.state === "active")) return null;
  if (by.lesson_ru === "error" || by.lesson_en === "error") return "lesson_failed";
  if (by.transcript === "warn" && (by.lesson_ru !== "done" || by.lesson_en !== "done")) return "transcript";
  if (by.lesson_ru === "warn" || by.lesson_en === "warn") return "draft";
  if (by.publish === "ready") return "review";
  return null;
}
