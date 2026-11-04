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
}
export interface EarnedBadge { id: string; awardedAt: number }

export interface LevelInfo { level: number; rank: RankKey; xp: number; levelStartXp: number; nextLevelXp: number; progress: number }

export interface StreakInfo { current: number; best: number; freezes: number; maxFreezes: number; status: StreakStatus; freezesPending: number; lastDay: string | null }

export interface ActivityCell { day: string; xp: number; index: number /* 1..66 program day */ }

export interface ShippedItem { kind: "boss" | "ship"; key: string; day: number | null; title: Partial<Record<Lang, string>>; url: string | null; at: number }

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
