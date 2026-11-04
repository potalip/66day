import type { Env, JobMessage } from "./env";
import { studioJobs } from "./routes/studio";

// Each area registers its handler here. Owners: resource.* → library agent, studio.* → studio agent.
type Handler = (env: Env, msg: JobMessage) => Promise<void>;
export const jobHandlers: Partial<Record<JobMessage["kind"], Handler>> = {};
jobHandlers["studio.plan"] = studioJobs.plan;
jobHandlers["studio.render"] = studioJobs.render;

export async function handleQueue(batch: MessageBatch<JobMessage>, env: Env) {
  for (const m of batch.messages) {
    const h = jobHandlers[m.body.kind];
    if (!h) { console.warn("no handler for", m.body.kind); m.ack(); continue; }
    try { await h(env, m.body); m.ack(); } catch (e) { console.error(m.body.kind, e); m.retry(); }
  }
}
