import { describe, expect, it } from "vitest";
import { exampleStoryboard, getTemplate } from "../../../../worker/lib/studio/storyboard";
import { applyRecap } from "./prefill";

describe("day-recap prefill", () => {
  it("fills day, tasks, XP, streak and tomorrow into the template", () => {
    const sb = exampleStoryboard(getTemplate("day-recap")!, "ru");
    const out = applyRecap(sb, { day: 21, title: "Свой первый бот", done: ["Сделал бота"], xp: 90, streak: 7, next: "Память бота" });
    const recap = out.scenes.find((s) => s.kind === "recap")!;
    expect(out.fields.day).toBe(21);
    expect(recap.fields).toMatchObject({ day: 21, title: "Свой первый бот", done: ["Сделал бота"], xp: 90, streak: 7 });
    expect(out.scenes.find((s) => s.kind === "next")!.fields.title).toBe("Память бота");
    expect(out.scenes.find((s) => s.kind === "outro")!.fields.title).toBe("Ещё 45 дней.");
    expect(sb.fields.day).toBe(12); // input untouched
  });
});
