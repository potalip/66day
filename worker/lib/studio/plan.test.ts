import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../../env";
import { planStoryboard } from "./plan";
import { getTemplate } from "./storyboard";

const env = { ANTHROPIC_API_KEY: "test", CLAUDE_MODEL: "claude-sonnet-5-5", CLAUDE_MODEL_SMART: "claude-opus-5-5" } as unknown as Env;
const T = getTemplate("listicle")!;
const reply = (text: string) => new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("planStoryboard (mocked Claude API)", () => {
  it("returns a validated storyboard and sends the brief + language rule", async () => {
    const good = { ...T.examples.ru, title: "Ошибки новичка" };
    const fetchMock = vi.fn(async () => reply("Вот план:\n```json\n" + JSON.stringify(good) + "\n```"));
    vi.stubGlobal("fetch", fetchMock);
    const res = await planStoryboard(env, { template: T, lang: "ru", style: "night", format: "16x9", brief: "5 ошибок новичка с ИИ" });
    expect(res.ok).toBe(true);
    if (res.ok) { expect(res.storyboard.style).toBe("night"); expect(res.storyboard.format).toBe("16x9"); }
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("claude-sonnet-5-5");
    expect(body.messages[0].content).toContain("5 ошибок новичка с ИИ");
    expect(body.system).toContain("Russian");
  });
  it("repairs once when the first answer fails validation", async () => {
    const bad = { template: "listicle", scenes: [{ kind: "item", fields: {} }] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply(JSON.stringify(bad)))
      .mockResolvedValueOnce(reply(JSON.stringify(T.examples.en)));
    vi.stubGlobal("fetch", fetchMock);
    const res = await planStoryboard(env, { template: T, lang: "en", style: "forest", format: "9x16", brief: "tools" });
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse((fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string).messages[0].content).toContain("failed validation");
  });
  it("degrades without a key and on API errors", async () => {
    expect((await planStoryboard({ ...env, ANTHROPIC_API_KEY: undefined } as Env, { template: T, lang: "en", style: "forest", format: "9x16", brief: "" })).ok).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("overloaded", { status: 529 })));
    const res = await planStoryboard(env, { template: T, lang: "en", style: "forest", format: "9x16", brief: "x" });
    expect(res).toMatchObject({ ok: false, reason: "api_error" });
  });
});
