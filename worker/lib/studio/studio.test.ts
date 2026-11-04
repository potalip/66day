import { describe, expect, it } from "vitest";
import { acceptPlan, buildPrompt, extractJson } from "./plan";
import { blankScene, catalog, exampleStoryboard, getTemplate, parseLines, totalDuration, validateStoryboard } from "./storyboard";

describe("catalog", () => {
  it("has at least 6 templates, each with valid EN + RU examples", () => {
    expect(catalog.templates.length).toBeGreaterThanOrEqual(6);
    for (const T of catalog.templates) {
      for (const lang of ["en", "ru"] as const) {
        const v = validateStoryboard(T.examples[lang]);
        expect(v.errors, `${T.id}/${lang}`).toEqual([]);
        expect(v.storyboard!.lang).toBe(lang);
      }
    }
  });
});

describe("validateStoryboard", () => {
  it("fixes soft problems and keeps the storyboard renderable", () => {
    const v = validateStoryboard({
      template: "explainer", style: "neon", format: "4x3",
      scenes: [{ kind: "intro", duration: 99, fields: { title: "x".repeat(300) } }, { kind: "step", fields: { title: "Do it", icon: "nope" } }],
    });
    expect(v.ok).toBe(true);
    const sb = v.storyboard!;
    expect(sb.style).toBe("paper");
    expect(sb.format).toBe("9x16");
    expect(sb.scenes[0].duration).toBe(6);
    expect((sb.scenes[0].fields.title as string).length).toBe(70);
    expect(sb.scenes[1].fields.icon).toBe("idea");
    expect(v.errors.every((e) => e.soft)).toBe(true);
  });
  it("rejects hard problems", () => {
    expect(validateStoryboard({ template: "nope" }).ok).toBe(false);
    const v = validateStoryboard({ template: "explainer", scenes: [{ kind: "step", fields: {} }, { kind: "dance" }] });
    expect(v.ok).toBe(false);
    expect(v.errors.map((e) => e.code)).toEqual(expect.arrayContaining(["required", "unknown"]));
  });
  it("normalises numbers, lists and line specs", () => {
    const v = validateStoryboard({
      template: "numbers", scenes: [
        { kind: "stat", fields: { value: "1 200,5", label: "x", decimals: 9 } },
        { kind: "bars", fields: { items: "A: 1\nB: 2\n\n", title: "t" } },
      ],
    });
    expect(v.ok).toBe(true);
    expect(v.storyboard!.scenes[0].fields.value).toBe(1200.5);
    expect(v.storyboard!.scenes[0].fields.decimals).toBe(2);
    expect(v.storyboard!.scenes[1].fields.items).toEqual(["A: 1", "B: 2"]);
    expect(parseLines("2, 4-6 x")).toEqual([2, 4, 5, 6]);
  });
  it("builds examples and blank scenes", () => {
    const T = getTemplate("day-recap")!;
    const sb = exampleStoryboard(T, "ru", "night", "16x9");
    expect(sb.style).toBe("night");
    expect(sb.format).toBe("16x9");
    expect(totalDuration(sb)).toBeGreaterThan(5);
    const s = blankScene(T, "recap");
    expect(s.fields.day).toBe(1);
    expect(s.fields.done).toEqual([]);
  });
});

describe("AI plan parsing", () => {
  it("extracts JSON from chatty or fenced output", () => {
    expect(extractJson('Sure!\n```json\n{"a": {"b": "}"}}\n```')).toEqual({ a: { b: "}" } });
    expect(extractJson("no json here")).toBeNull();
  });
  it("pins the user's choices and validates the plan", () => {
    const T = getTemplate("listicle")!;
    const raw = { ...T.examples.en, style: "nope", format: "16x9", lang: "ru" };
    const res = acceptPlan(raw, { template: T, lang: "en", style: "night", format: "1x1", handle: "@me" });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.storyboard.style).toBe("night");
      expect(res.storyboard.format).toBe("1x1");
      expect(res.storyboard.lang).toBe("en");
    }
    expect(acceptPlan({ template: "listicle", scenes: [] }, { template: T, lang: "en", style: "night", format: "1x1" }).ok).toBe(false);
  });
  it("writes a prompt that names the template, its scene kinds and the language rule", () => {
    const T = getTemplate("code-walkthrough")!;
    const { system, prompt } = buildPrompt({ template: T, lang: "ru", style: "terminal", format: "9x16", brief: "Как сделать бота" });
    expect(system).toContain("Russian");
    expect(prompt).toContain('kind "code"');
    expect(prompt).toContain("Как сделать бота");
  });
});

describe("assets", () => {
  it("accepts uploaded asset paths and http URLs, rejects others", async () => {
    const T = getTemplate("before-after")!;
    const sb = exampleStoryboard(T, "en");
    const i = sb.scenes.findIndex((s) => s.kind === "screen");
    sb.scenes[i].fields.image = "/api/studio/assets/prj_x/abc.png";
    expect(validateStoryboard(sb).storyboard!.scenes[i].fields.image).toBe("/api/studio/assets/prj_x/abc.png");
    sb.scenes[i].fields.image = "javascript:alert(1)";
    expect(validateStoryboard(sb).storyboard!.scenes[i].fields.image).toBe("");
    const { absolutizeAssets } = await import("./service");
    const out = absolutizeAssets({ a: ["/api/studio/assets/p/x.png", "/other"], b: { c: "/api/studio/assets/p/y.jpg" } }, "https://app.example");
    expect(out).toEqual({ a: ["https://app.example/api/studio/assets/p/x.png", "/other"], b: { c: "https://app.example/api/studio/assets/p/y.jpg" } });
  });
});
