/**
 * OWNER: learn. Response shapes of /api/curriculum/* and /api/progress/* — imported (type-only) by the web app.
 */
import type { Award, CurriculumDay, DayTrack, Lang, ProgramPhase, ProofType, Track } from "../../../shared/types";
import type { DayAccess, DayStatus } from "./schedule";

export type { DayAccess, DayStatus };

export interface BadgeDef {
  id: string;
  icon: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  rule: string;
}

export interface GeneratedContent {
  version: number;
  source: "curriculum" | "fixtures";
  totalDays: number;
  programs: Partial<Record<Lang, { lang: Lang; title: string; tagline: string; phases: ProgramPhase[] }>>;
  days: CurriculumDay[];
  badges: BadgeDef[];
  missingDays: Partial<Record<Lang, number[]>>;
}

/** One cell of the 66-day map. `available: false` = not written yet. */
export interface DaySummary {
  day: number;
  phase: number;
  track: DayTrack | null;
  available: boolean;
  title: string;
  summary: string;
  estMinutes: number;
  rest: boolean;
  boss: boolean;
  taskCount: number;
  xp: number;
}

export interface ProgramResponse {
  lang: Lang;
  track: Track;
  source: GeneratedContent["source"];
  totalDays: number;
  program: { title: string; tagline: string; phases: ProgramPhase[] };
  days: DaySummary[];
}

export type GoalKey = "portfolio" | "job" | "project" | "habit" | "curious";

export interface LearnProfile {
  name: string | null;
  track: Track;
  dailyMinutes: number;
  goal: GoalKey | null;
  goalNote: string | null;
  timezone: string;
  startedAt: number;
}

export interface PathCell extends DaySummary {
  access: DayAccess;
  isToday: boolean;
  tasksDone: number;
  completedAt: number | null;
}

export interface Overview {
  onboarded: boolean;
  profile: LearnProfile | null;
  totalDays: number;
  nextDay: number | null;
  status: DayStatus;
  calendarDay: number;
  behind: number;
  completedCount: number;
  completedToday: number;
  percent: number;
  xpEarned: number;
  source: GeneratedContent["source"];
  program: ProgramResponse["program"];
  cells: PathCell[];
}

export type SubmissionStatus = "submitted" | "approved" | "needs_work";

export interface SubmissionView {
  id: string;
  proof: ProofType;
  text: string | null;
  url: string | null;
  file: { name: string; type: string; size: number; href: string } | null;
  status: SubmissionStatus;
  reviewer: string | null;
  feedback: string | null;
  createdAt: number;
}

export interface TaskState {
  done: boolean;
  completedAt: number | null;
  submission: SubmissionView | null;
}

export interface DayResponse {
  day: CurriculumDay | null;
  summary: DaySummary;
  access: DayAccess;
  status: DayStatus;
  completedAt: number | null;
  tasks: Record<string, TaskState>;
  /** Teaser of the following day (title/summary only). */
  next: DaySummary | null;
  /** What the student may do with the following day right now. */
  nextAccess: DayAccess | null;
  /** True for the day the student should work on now. */
  isToday: boolean;
}

export interface TaskResult {
  taskId: string;
  task: TaskState;
  dayCompleted: boolean;
  awards: Award[];
  /** Total awards from task + day completion. */
  nextDay: number | null;
  status: DayStatus;
}

export interface DayCompleteResult {
  day: number;
  dayCompleted: boolean;
  awards: Award[];
  nextDay: number | null;
  status: DayStatus;
}

export interface OnboardingResult {
  awards: Award[];
  overview: Overview;
}
