// OWNER: game agent. JSON shapes of /api/game/* (imported by the web UI as types only).
import type { Lang, Track } from "../../../shared/types";
import type { RankKey } from "./levels";
import type { StreakStatus } from "./streak";

export interface BadgeInfo {
  id: string;
  icon: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  group: string;
  secret: boolean;
}
export interface EarnedBadge { id: string; awardedAt: number }

export interface LevelInfo { level: number; rank: RankKey; xp: number; levelStartXp: number; nextLevelXp: number; progress: number }

export interface StreakInfo { current: number; best: number; freezes: number; maxFreezes: number; status: StreakStatus; freezesPending: number; lastDay: string | null }

export interface ActivityCell { day: string; xp: number; index: number /* 1..66 program day */ }

export interface ShippedItem { kind: "boss" | "ship"; key: string; day: number | null; title: Partial<Record<Lang, string>>; url: string | null; at: number }

export interface WeeklyRecap {
  from: string;
  to: string;
  xp: number;
  prevXp: number;
  activeDays: number;
  tasks: number;
  badges: string[];
  bestDay: { day: string; xp: number } | null;
  days: { day: string; xp: number }[];
}

export interface GameMe extends LevelInfo {
  userId: string;
  name: string | null;
  track: Track | null;
  timezone: string;
  today: string;
  streak: StreakInfo;
  badges: EarnedBadge[];
  weekXp: number;
  ranks: { week: number | null; all: number | null };
  activity: ActivityCell[];
  recap: WeeklyRecap;
}

export interface PublicProfile extends LevelInfo {
  userId: string;
  name: string | null;
  track: Track | null;
  isMe: boolean;
  joinedAt: number;
  streak: StreakInfo;
  badges: EarnedBadge[];
  activity: ActivityCell[];
  shipped: ShippedItem[];
  /** only for your own profile */
  recap: WeeklyRecap | null;
}

export interface LeaderRow { rank: number; userId: string; name: string | null; xp: number; level: number; track: Track | null; streak: number; isMe: boolean }

export interface LeaderboardResponse {
  period: "week" | "all";
  track: "all" | Track;
  week: string;
  resetsAt: number;
  total: number;
  rows: LeaderRow[];
  me: LeaderRow | null;
}

export interface QuestView {
  id: string;
  icon: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  xp: number;
  target: number;
  progress: number;
  done: boolean;
  completedAt: number | null;
}
export interface QuestsResponse { week: string; resetsAt: number; quests: QuestView[] }

export interface CertificateResponse {
  userId: string;
  certId: string;
  name: string | null;
  track: Track | null;
  status: "complete" | "in_progress" | "not_started";
  daysDone: number;
  totalDays: number;
  startedAt: number | null;
  completedAt: number | null;
  issuedAt: number | null;
  level: number;
  rank: RankKey;
  xp: number;
  bestStreak: number;
  badges: { id: string; icon: string; title: Record<Lang, string>; awardedAt: number }[];
  badgeCount: number;
  shippedCount: number;
}
