import { describe, expect, it } from "vitest";
import { landing } from "./strings";

function shape(o: unknown): unknown {
  if (Array.isArray(o)) return o.map(shape);
  if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)]));
  return typeof o;
}

describe("landing strings", () => {
  it("RU and EN have the same shape", () => expect(shape(landing.ru)).toEqual(shape(landing.en)));
  it("no empty strings", () => {
    const walk = (o: unknown): string[] => typeof o === "string" ? [o] : o && typeof o === "object" ? Object.values(o).flatMap(walk) : [];
    for (const l of [landing.en, landing.ru]) for (const s of walk(l)) expect(s.trim().length).toBeGreaterThan(0);
  });
});
