/** Tiny typed fetch helper. All API calls go through here. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { ...(init?.json !== undefined ? { "content-type": "application/json" } : {}), ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}
