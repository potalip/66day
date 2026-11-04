// Validate seed lesson materials against the zod schema.
// Usage: node --experimental-strip-types worker/lib/library/seed/validate.mjs [en|ru]
import { readFileSync, existsSync } from "node:fs";
import { lessonMaterialSchema, TOPICS } from "../schema.ts";

const dir = new URL(".", import.meta.url);
const resources = JSON.parse(readFileSync(new URL("resources.json", dir), "utf8"));
let bad = 0;
for (const lang of process.argv[2] ? [process.argv[2]] : ["en", "ru"]) {
  const f = new URL(`materials.${lang}.json`, dir);
  if (!existsSync(f)) { console.log(`materials.${lang}.json missing`); bad++; continue; }
  const mats = JSON.parse(readFileSync(f, "utf8"));
  for (const r of resources.filter((r) => r.audience.includes(lang))) {
    const m = mats[r.id];
    if (!m) { console.log(`${lang} ${r.id}: MISSING`); bad++; continue; }
    const res = lessonMaterialSchema.safeParse(m);
    if (!res.success) { bad++; console.log(`${lang} ${r.id}:`, res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")); }
    else {
      const unknown = res.data.topics.filter((t) => !TOPICS.includes(t));
      if (unknown.length) { bad++; console.log(`${lang} ${r.id}: unknown topics ${unknown}`); }
    }
  }
  for (const id of Object.keys(mats)) if (!resources.find((r) => r.id === id && r.audience.includes(lang))) { console.log(`${lang} ${id}: not in resources.json audience`); bad++; }
}
console.log(bad ? `${bad} problem(s)` : "all seed materials valid");
process.exit(bad ? 1 : 0);
