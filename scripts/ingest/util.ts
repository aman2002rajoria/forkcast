import fs from "node:fs";
import path from "node:path";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function readJson<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(file, "utf8")) as T; } catch { return null; }
}
/** Write via a temp file so an interrupted run never leaves half a JSON file. */
export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
  fs.renameSync(tmp, file);
}
export function ageDays(file: string) {
  try { return (Date.now() - fs.statSync(file).mtimeMs) / 86_400_000; } catch { return Infinity; }
}

/** Simple rate limiter: at most `perSecond` starts per second. */
export function limiter(perSecond: number) {
  let next = 0;
  return async () => {
    const now = Date.now();
    const wait = Math.max(0, next - now);
    next = Math.max(now, next) + 1000 / perSecond;
    if (wait) await sleep(wait);
  };
}

/** Run tasks with bounded concurrency. */
export async function pool<T>(items: T[], n: number, fn: (x: T, i: number) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

export async function retry<T>(fn: () => Promise<T>, label: string, tries = 4): Promise<T> {
  let err: unknown;
  for (let k = 0; k < tries; k++) {
    try { return await fn(); } catch (e) {
      err = e;
      const status = (e as { status?: number }).status;
      if (status && status < 500 && status !== 429) throw e;
      const wait = 1000 * 2 ** k + Math.random() * 400;
      log(`  retry ${label} in ${Math.round(wait)} ms (${(e as Error).message})`);
      await sleep(wait);
    }
  }
  throw err;
}

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

export const log = (...a: unknown[]) => console.log(...a);
export const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
