import { describe, expect, it } from "vitest";
import { calloutKind, inlineText, parseInline, parseMarkdown, safeUrl } from "./markdown";

describe("parseInline", () => {
  it("parses bold, italic, code and links", () => {
    const r = parseInline("Say **hi** to *you* and `run` [docs](https://x.dev)");
    expect(r.map((n) => n.t)).toEqual(["text", "strong", "text", "em", "text", "code", "text", "link"]);
    expect(r[7]).toMatchObject({ t: "link", href: "https://x.dev" });
  });
  it("keeps snake_case literal", () => {
    expect(inlineText(parseInline("use my_var_name here"))).toBe("use my_var_name here");
    expect(parseInline("use my_var_name here")).toHaveLength(1);
  });
  it("drops javascript: links but keeps the label", () => {
    const r = parseInline("[click](javascript:alert(1))");
    expect(r.some((n) => n.t === "link")).toBe(false);
    expect(inlineText(r)).toContain("click");
  });
  it("autolinks bare URLs without trailing punctuation", () => {
    const r = parseInline("See https://example.com/a.");
    expect(r[1]).toMatchObject({ t: "link", href: "https://example.com/a" });
    expect(r[2]).toMatchObject({ t: "text", v: "." });
  });
  it("shows raw html as text", () => {
    expect(parseInline("<script>x</script>")).toEqual([{ t: "text", v: "<script>x</script>" }]);
  });
  it("handles cyrillic emphasis", () => {
    const r = parseInline("*«Страница, которую можно скинуть»*");
    expect(r[0].t).toBe("em");
  });
});

describe("safeUrl", () => {
  it.each([
    ["https://a.b", "https://a.b"],
    ["mailto:x@y.z", "mailto:x@y.z"],
    ["/ru/day/2", "/ru/day/2"],
    ["#top", "#top"],
    ["javascript:alert(1)", null],
    ["JaVaScRiPt:alert(1)", null],
    ["data:text/html,x", null],
    ["//evil.com", null],
  ])("%s → %s", (i, o) => expect(safeUrl(i)).toBe(o));
});

describe("parseMarkdown", () => {
  it("parses headings with unique ids", () => {
    const b = parseMarkdown("## Set up\n\ntext\n\n## Set up");
    expect(b[0]).toMatchObject({ t: "h", level: 2, id: "set-up" });
    expect(b[2]).toMatchObject({ t: "h", id: "set-up-2" });
  });
  it("parses fenced code verbatim", () => {
    const b = parseMarkdown("```\nCreate a page.\n**not bold**\n```");
    expect(b).toEqual([{ t: "code", lang: "", v: "Create a page.\n**not bold**" }]);
  });
  it("parses ordered and nested lists", () => {
    const b = parseMarkdown("1. one\n2. two\n   - a\n   - b\n3. three");
    expect(b).toHaveLength(1);
    const l = b[0] as Extract<(typeof b)[0], { t: "list" }>;
    expect(l.ordered).toBe(true);
    expect(l.items).toHaveLength(3);
    expect(l.items[1].c[1]).toMatchObject({ t: "list", ordered: false });
  });
  it("parses task list items", () => {
    const b = parseMarkdown("- [x] done\n- [ ] todo");
    const l = b[0] as Extract<(typeof b)[0], { t: "list" }>;
    expect(l.items.map((i) => i.checked)).toEqual([true, false]);
  });
  it("detects callouts in RU and EN", () => {
    expect(parseMarkdown("> **Tip:** do it")[0]).toMatchObject({ t: "quote", callout: "tip" });
    expect(parseMarkdown("> **Совет:** делай")[0]).toMatchObject({ t: "quote", callout: "tip" });
    expect(parseMarkdown("> **Важно:** да")[0]).toMatchObject({ t: "quote", callout: "warn" });
    expect(parseMarkdown("> just a quote")[0]).toMatchObject({ t: "quote", callout: null });
    expect(calloutKind("Note:")).toBe("note");
    expect(calloutKind("If you're stuck:")).toBe("stuck");
    expect(calloutKind("Если застрял")).toBe("stuck");
    expect(calloutKind("Безопасность, на будущее:")).toBe("warn");
    expect(calloutKind("Tip (Supabase path):")).toBe("tip");
    expect(calloutKind("Money note:")).toBe("note");
  });
  it("parses tables", () => {
    const b = parseMarkdown("| a | b |\n|---|:-:|\n| 1 | 2 |\n| 3 | 4 |");
    expect(b[0]).toMatchObject({ t: "table", align: [null, "center"] });
    expect((b[0] as { rows: unknown[] }).rows).toHaveLength(2);
  });
  it("splits paragraph before a list without blank line", () => {
    const b = parseMarkdown("Good candidates:\n- one\n- two");
    expect(b.map((x) => x.t)).toEqual(["p", "list"]);
  });
  it("parses the fixture lesson shape", () => {
    const md = "## What\n\nA **coding agent** is.\n\n1. Create.\n2. Open.\n\n> **Tip:** relax.\n\n```\nprompt\n```\n\n- a;\n- b.";
    expect(parseMarkdown(md).map((b) => b.t)).toEqual(["h", "p", "list", "quote", "code", "list"]);
  });
  it("parses <details> with summary as a collapsed block", () => {
    const b = parseMarkdown("Quiz.\n\n<details><summary>Answers</summary>\n\n1. One.\n2. Two.\n\n</details>\n\nAfter.");
    expect(b.map((x) => x.t)).toEqual(["p", "details", "p"]);
    const d = b[1] as Extract<(typeof b)[0], { t: "details" }>;
    expect(inlineText(d.summary)).toBe("Answers");
    expect(d.c[0]).toMatchObject({ t: "list", ordered: true });
  });
  it("parses summary on its own line", () => {
    const b = parseMarkdown("<details>\n<summary>Ответы</summary>\n\ntext\n</details>");
    expect(b[0]).toMatchObject({ t: "details" });
  });
  it("supports GitHub alerts", () => {
    const b = parseMarkdown("> [!TIP]\n> Do this.");
    expect(b[0]).toMatchObject({ t: "quote", callout: "tip" });
    expect(parseMarkdown("> [!WARNING] careful")[0]).toMatchObject({ t: "quote", callout: "warn" });
  });
});
