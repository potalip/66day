import type { Env } from "../env";
import type { Award, GameEvent } from "../../shared/types";
import { applyEvent } from "./game/store";
import { InvalidEvent } from "./game/engine";

/**
 * OWNER: game agent. Contract: any area calls `onGameEvent` after a meaningful action and shows returned awards.
 * Must be idempotent per (userId, event identity) — callers may retry.
 *
 * Event identity: task.completed → taskId, day.completed → day, onboarding.completed → once per user,
 * resource.viewed → resourceId, studio.rendered → projectId. Retries return the awards of the first call.
 * Never throws for bad input (returns []); never blocks the caller's main action on a game failure.
 */
export async function onGameEvent(env: Env, userId: string, ev: GameEvent): Promise<Award[]> {
  try {
    return await applyEvent(env.DB, userId, ev);
  } catch (e) {
    if (!(e instanceof InvalidEvent)) console.error("game: onGameEvent failed", ev?.type, e);
    return [];
  }
}
