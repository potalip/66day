import { describe, expect, it } from "vitest";
import { formatters } from "./format";

describe("formatters", () => {
  it("formats numbers per locale", () => {
    expect(formatters("en").number(1240)).toBe("1,240");
    expect(formatters("ru").number(1240).replace(/\s/g, " ")).toBe("1 240");
  });
  it("picks Russian plural forms", () => {
    const f = formatters("ru");
    const forms = { one: "день", few: "дня", many: "дней", other: "дня" };
    expect([1, 2, 5, 21, 11].map((n) => f.plural(n, forms))).toEqual(["день", "дня", "дней", "день", "дней"]);
  });
});
