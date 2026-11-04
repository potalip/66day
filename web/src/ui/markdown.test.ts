import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown, safeUrl } from "./markdown";

describe("parseInline", () => {
  it("parses bold, italic, code and links", () => {
    expect(parseInline("a **b** *c* `d` [e](https://x.dev)")).toEqual([
      { t: "text", v: "a " }, { t: "strong", c: [{ t: "text", v: "b" }] }, { t: "text", v: " " },
      { t: "em", c: [{ t: "text", v: "c" }] }, { t: "text", v: " " }, { t: "code", v: "d" }, { t: "text", v: " " },
      { t: "link", href: "https://x.dev", c: [{ t: "text", v: "e" }] },
    ]);
  });
  it("keeps snake_case literal", () => {
    expect(parseInline("my_var_name")).toEqual([{ t: "text", v: "my_var_name" }]);
  });
  it("drops javascript: links but keeps their text", () => {
    expect(parseInline("[click](javascript:alert(1))")).toEqual([{ t: "text", v: "click" }]);
  });
  it("autolinks bare urls without trailing punctuation", () => {
    const r = parseInline("see https://claude.ai/code.");
    expect(r[1]).toEqual({ t: "link", href: "https://claude.ai/code", c: [{ t: "text", v: "https://claude.ai/code" }] });
  });
  it("handles Cyrillic emphasis", () => {
    expect(parseInline("**привет**")).toEqual([{ t: "strong", c: [{ t: "text", v: "привет" }] }]);
  });
});

describe("safeUrl", () => {
  it.each([["https://a.b", true], ["/ru/day/3", true], ["mailto:x@y.z", true], ["javascript:alert(1)", false], ["data:text/html,x", false]])(
    "%s → %s", (u, ok) => expect(safeUrl(u) !== null).toBe(ok));
});

describe("parseMarkdown", () => {
  it("parses headings, lists, code, callouts and hr", () => {
    const md = "# Title\n\nPara one\ncontinues.\n\n- a\n- b\n  - nested\n\n1. one\n2. two\n\n```js\nconst x = 1;\n```\n\n> [!TIP] Be kind\n\n---";
    const b = parseMarkdown(md);
    expect(b.map((x) => x.type)).toEqual(["heading", "p", "list", "list", "code", "callout", "hr"]);
    const ul = b[2] as Extract<typeof b[number], { type: "list" }>;
    expect(ul.items).toHaveLength(2);
    expect(ul.items[1].children?.type).toBe("list");
    expect((b[4] as { lang?: string; v: string })).toMatchObject({ lang: "js", v: "const x = 1;" });
    expect(b[5]).toMatchObject({ type: "callout", kind: "tip" });
  });
  it("never emits raw html", () => {
    const b = parseMarkdown("<script>alert(1)</script>");
    expect(b).toEqual([{ type: "p", c: [{ t: "text", v: "<script>alert(1)</script>" }] }]);
  });
  it("keeps list start number", () => {
    expect(parseMarkdown("3. three\n4. four")[0]).toMatchObject({ type: "list", ordered: true, start: 3 });
  });
});
