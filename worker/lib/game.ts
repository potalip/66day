import type { Env } from "../env";
import type { Award, GameEvent } from "../../shared/types";

/**
 * OWNER: game agent. Contract: any area calls `onGameEvent` after a meaningful action and shows returned awards.
 * Must be idempotent per (userId, event identity) — callers may retry.
 */
export async function onGameEvent(_env: Env, _userId: string, _ev: GameEvent): Promise<Award[]> {
  return [];
}
