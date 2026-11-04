/**
 * Cross-area contracts. OWNER: orchestrator. Changing a type here = tell everyone (note it in docs/CHANGELOG-CONTRACTS.md).
 */
export type Lang = "ru" | "en";
export type Track = "apps" | "video";
export type DayTrack = "common" | Track;

export type TaskType = "watch" | "read" | "build" | "ship" | "reflect" | "quiz" | "share";
export type ProofType = "none" | "link" | "text" | "file";

export interface CurriculumTask {
  id: string;            // stable across languages: "d07-apps-t2"
  type: TaskType;
  title: string;
  xp: number;
  proof: ProofType;
  optional?: boolean;
}

export interface CurriculumDay {
  day: number;           // 1..66
  track: DayTrack;       // "common" days are shared by both tracks
  lang: Lang;
  phase: number;         // see program.json
  title: string;
  summary: string;
  estMinutes: number;
  rest?: boolean;        // rest/recharge day
  boss?: boolean;        // milestone project day
  tasks: CurriculumTask[];
  resources: string[];   // library resource ids or raw URLs
  badges?: string[];     // badge ids awarded when the day is completed
  bodyMd: string;        // lesson body (markdown)
}

export interface ProgramPhase { id: number; days: [number, number]; title: string; goal: string }
export interface Program { lang: Lang; title: string; tagline: string; phases: ProgramPhase[] }

/** Events the learn area emits; the game area turns them into XP/badges/streaks. */
export type GameEvent =
  | { type: "task.completed"; taskId: string; day: number; xp: number }
  | { type: "day.completed"; day: number; badges?: string[] }
  | { type: "onboarding.completed"; track: Track }
  | { type: "resource.viewed"; resourceId: string }
  | { type: "studio.rendered"; projectId: string };

export interface Award { kind: "xp" | "badge" | "level" | "streak"; amount?: number; id?: string; label?: string }
