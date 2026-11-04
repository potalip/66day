import { afterEach, describe, expect, it, vi } from "vitest";
import { loadProofTargets, submitProof } from "./proof";

const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status });
afterEach(() => vi.unstubAllGlobals());

function mockLearn(access: string) {
  vi.stubGlobal("fetch", vi.fn(async (u: string) => {
    if (u.startsWith("/api/progress?")) return json({ onboarded: true, nextDay: 2 });
    if (u.startsWith("/api/progress/day/2")) return json({
      access,
      day: { tasks: [{ id: "d02-t1", proof: "none", title: "Read" }, { id: "d02-t2", proof: "link", title: "Share your page" }, { id: "d02-t3", proof: "link", title: "Post it" }] },
      tasks: { "d02-t3": { done: true } },
    });
    return json({}, 404);
  }));
}

describe("task proof from a video", () => {
  it("offers open link-proof tasks of the current day", async () => {
    mockLearn("open");
    expect(await loadProofTargets("en")).toEqual([{ day: 2, taskId: "d02-t2", title: "Share your page" }]);
  });
  it("offers nothing when the day is not open yet or learn is missing", async () => {
    mockLearn("waiting");
    expect(await loadProofTargets("en")).toEqual([]);
    vi.stubGlobal("fetch", vi.fn(async () => json({}, 404)));
    expect(await loadProofTargets("ru")).toEqual([]);
  });
  it("submits the link as JSON", async () => {
    const f = vi.fn(async () => json({ ok: true }));
    vi.stubGlobal("fetch", f);
    expect(await submitProof("en", { day: 2, taskId: "d02-t2", title: "x" }, "https://a.b/s/1.mp4")).toBe(true);
    expect(f.mock.calls[0]).toMatchObject(["/api/progress/day/2/task/d02-t2?lang=en", { method: "POST", body: JSON.stringify({ url: "https://a.b/s/1.mp4" }) }]);
  });
});
