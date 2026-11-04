import type { Env } from "../env";

/**
 * Single entry point for every LLM call on the platform (pipeline, studio, later AI review).
 * Uses the Anthropic Messages API over fetch (no SDK needed in Workers).
 * Returns null when no key is configured so dev/test flows degrade gracefully.
 */
export async function claude(
  env: Env,
  opts: { system?: string; prompt: string; smart?: boolean; maxTokens?: number; json?: boolean },
): Promise<string | null> {
  if (!env.ANTHROPIC_API_KEY) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.smart ? env.CLAUDE_MODEL_SMART : env.CLAUDE_MODEL,
      max_tokens: opts.maxTokens ?? 4096,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });
  if (!res.ok) throw new Error(`claude ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}
