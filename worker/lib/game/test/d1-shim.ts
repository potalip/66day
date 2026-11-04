// @ts-nocheck — node-only test helper (repo has no @types/node; typed loosely on purpose)
// OWNER: game agent. Minimal D1Database over node:sqlite so tests run the real SQL + migrations.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

type Val = string | number | null | bigint | Uint8Array;

class Stmt {
  constructor(private db: DatabaseSync, public sql: string, public params: Val[] = []) {}
  bind(...p: unknown[]) {
    return new Stmt(this.db, this.sql, p.map((v) => (v === undefined ? null : typeof v === "boolean" ? Number(v) : (v as Val))));
  }
  _all() {
    return this.db.prepare(this.sql).all(...this.params) as Record<string, unknown>[];
  }
  async first<T>(col?: string): Promise<T | null> {
    const r = this._all()[0];
    if (!r) return null;
    return (col ? r[col] : { ...r }) as T;
  }
  async all<T>() {
    return { results: this._all().map((r) => ({ ...r })) as T[], success: true, meta: {} };
  }
  async run() {
    const r = this.db.prepare(this.sql).run(...this.params);
    return { results: [], success: true, meta: { changes: Number(r.changes) } };
  }
  async raw() {
    return this._all().map((r) => Object.values(r));
  }
}

export function createTestD1(): D1Database & { sqlite: DatabaseSync } {
  const db = new DatabaseSync(":memory:");
  const dir = path.resolve(__dirname, "../../../../migrations");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) db.exec(readFileSync(path.join(dir, f), "utf8"));
  const api = {
    sqlite: db,
    prepare: (sql: string) => new Stmt(db, sql),
    async batch(stmts: Stmt[]) {
      db.exec("BEGIN");
      try {
        const out = stmts.map((s) => ({ results: s._all().map((r) => ({ ...r })), success: true, meta: {} }));
        db.exec("COMMIT");
        return out;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    async exec(sql: string) {
      db.exec(sql);
      return { count: 1, duration: 0 };
    },
  };
  return api as unknown as D1Database & { sqlite: DatabaseSync };
}
