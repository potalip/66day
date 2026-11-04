import { describe, expect, it } from "vitest";
import { content } from "./content";
import { defaultVisibility, kindOf, toItem } from "./portfolio";

const base = {
  id: "sub1", day: 0, proof_type: "link" as const, text_value: "note", url_value: "https://x.dev", file_key: null, file_name: null,
  file_type: null, file_size: null, created_at: 1, visibility: null, title: null, description: null, sort: null,
};
const findTask = (pred: (d: (typeof content.days)[0], t: (typeof content.days)[0]["tasks"][0]) => boolean) => {
  for (const d of content.days) if (d.lang === "en") for (const t of d.tasks) if (pred(d, t)) return { d, t };
  return null;
};

describe("portfolio visibility rules", () => {
  it("boss and ship with link/file are public by default; everything else private", () => {
    expect(defaultVisibility("boss", "link")).toBe("public");
    expect(defaultVisibility("ship", "file")).toBe("public");
    expect(defaultVisibility("boss", "text")).toBe("private");
    expect(defaultVisibility("other", "link")).toBe("private");
    expect(defaultVisibility("other", "text")).toBe("private");
  });
  it("kind: boss day wins over task type", () => {
    const t = { id: "x", type: "ship" as const, title: "t", xp: 1, proof: "link" as const };
    expect(kindOf({ boss: true, task: t })).toBe("boss");
    expect(kindOf({ boss: false, task: t })).toBe("ship");
    expect(kindOf({ boss: false, task: { ...t, type: "reflect" } })).toBe("other");
  });
});

describe("toItem", () => {
  const ship = findTask((d, t) => !d.boss && t.type === "ship");
  const reflect = findTask((d, t) => !d.boss && t.type === "reflect");
  it("maps a ship task with curriculum context", () => {
    expect(ship).not.toBeNull();
    const it = toItem({ ...base, task_id: ship!.t.id }, "en", "u1")!;
    expect(it).toMatchObject({ kind: "ship", visibility: "public", day: ship!.d.day, title: ship!.d.title, defaultTitle: ship!.d.title, taskTitle: ship!.t.title, url: "https://x.dev" });
  });
  it("uses the student's title/description overrides and visibility", () => {
    const it = toItem({ ...base, task_id: ship!.t.id, title: "My app", description: "Does X", visibility: "private" }, "en", "u1")!;
    expect(it).toMatchObject({ title: "My app", description: "Does X", visibility: "private" });
  });
  it("reflections are private unless made public", () => {
    const r = toItem({ ...base, proof_type: "text", url_value: null, task_id: reflect!.t.id }, "en", "u1")!;
    expect(r.visibility).toBe("private");
    expect(toItem({ ...base, proof_type: "text", task_id: reflect!.t.id, visibility: "public" }, "en", "u1")!.visibility).toBe("public");
  });
  it("files get a public portfolio URL and image detection", () => {
    const it = toItem({ ...base, task_id: ship!.t.id, url_value: null, proof_type: "file", file_key: "k", file_name: "a.png", file_type: "image/png", file_size: 9 }, "en", "u1")!;
    expect(it.file).toEqual({ href: "/api/progress/portfolio/u1/files/sub1", name: "a.png", type: "image/png", size: 9, isImage: true });
    const svg = toItem({ ...base, task_id: ship!.t.id, proof_type: "file", file_key: "k", file_type: "image/svg+xml" }, "en", "u1")!;
    expect(svg.file!.isImage).toBe(false); // never inline SVG
  });
  it("drops tasks that are no longer in the curriculum", () => {
    expect(toItem({ ...base, task_id: "d99-t9" }, "en", "u1")).toBeNull();
  });
  it("task ids are language independent (ru titles for ru)", () => {
    const ru = toItem({ ...base, task_id: ship!.t.id }, "ru", "u1")!;
    const ruDay = content.days.find((d) => d.lang === "ru" && d.tasks.some((t) => t.id === ship!.t.id))!;
    expect(ru.dayTitle).toBe(ruDay.title);
  });
});
