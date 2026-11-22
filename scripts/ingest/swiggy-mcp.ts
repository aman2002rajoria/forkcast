/**
 * Swiggy Food MCP client with OAuth (PKCE + dynamic client registration), using the official MCP SDK.
 * Tokens are saved to .forkcast/swiggy-auth.json (git-ignored). Access tokens last about 5 days and
 * refresh for 30; the SDK refreshes them for you.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { UnauthorizedError, type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientInformationMixed, OAuthClientMetadata, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { cfg, STATE } from "./config";
import { HttpError, log, readJson, writeJson } from "./util";

const AUTH_FILE = path.join(STATE, "swiggy-auth.json");
type Saved = { client?: OAuthClientInformationMixed; tokens?: OAuthTokens; verifier?: string };

class FileAuthProvider implements OAuthClientProvider {
  private s: Saved = readJson<Saved>(AUTH_FILE) ?? {};
  constructor(private interactive: boolean) {}
  private save() { fs.mkdirSync(STATE, { recursive: true, mode: 0o700 }); writeJson(AUTH_FILE, this.s); fs.chmodSync(AUTH_FILE, 0o600); }
  get redirectUrl() { return cfg.swiggyRedirect; }
  get clientMetadata(): OAuthClientMetadata {
    return { client_name: "Forkcast (personal)", redirect_uris: [cfg.swiggyRedirect], grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", scope: "mcp:tools" };
  }
  clientInformation() { return this.s.client; }
  saveClientInformation(c: OAuthClientInformationMixed) { this.s.client = c; this.save(); }
  tokens() { return this.s.tokens; }
  saveTokens(t: OAuthTokens) { this.s.tokens = t; this.save(); }
  saveCodeVerifier(v: string) { this.s.verifier = v; this.save(); }
  codeVerifier() { if (!this.s.verifier) throw new Error("No PKCE verifier saved. Run `npm run swiggy:login` again."); return this.s.verifier; }
  redirectToAuthorization(url: URL) {
    if (!this.interactive) throw new SwiggySignedOut();
    log(`\nSign in to Swiggy in your browser (phone number + OTP):\n${url.href}\n`);
    if (process.platform === "darwin") spawn("open", [url.href], { stdio: "ignore", detached: true }).unref();
  }
}

export class SwiggySignedOut extends Error { constructor() { super("Swiggy session missing or expired. Run `npm run swiggy:login`."); } }

/** Waits for Swiggy to redirect the browser back to the local callback URL with ?code=. */
function waitForCode(): Promise<string> {
  const u = new URL(cfg.swiggyRedirect);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const q = new URL(req.url ?? "/", u.origin);
      if (q.pathname !== u.pathname) { res.writeHead(404).end(); return; }
      const code = q.searchParams.get("code"), err = q.searchParams.get("error");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(`<p style="font:16px system-ui;margin:40px">${code ? "Signed in. You can close this tab." : `Sign-in failed: ${err}`}</p>`);
      server.close();
      code ? resolve(code) : reject(new Error(`Swiggy sign-in failed: ${err}`));
    });
    server.on("error", (e: NodeJS.ErrnoException) => reject(e.code === "EACCES" ? new Error(`Can't listen on port ${u.port || 80}. Set SWIGGY_REDIRECT_URL to a whitelisted localhost URL you can bind.`) : e));
    server.listen(Number(u.port || 80), "127.0.0.1");
  });
}

export async function connectSwiggy(interactive = false): Promise<Client> {
  const provider = new FileAuthProvider(interactive);
  const make = () => new StreamableHTTPClientTransport(new URL(cfg.swiggyUrl), { authProvider: provider });
  const client = new Client({ name: "forkcast-ingest", version: "0.1.0" });
  let transport = make();
  try {
    await client.connect(transport);
  } catch (e) {
    if (!(e instanceof UnauthorizedError) || !interactive) throw e instanceof UnauthorizedError ? new SwiggySignedOut() : e;
    const code = await waitForCode();
    await transport.finishAuth(code);
    transport = make();
    await client.connect(transport);
  }
  return client;
}

/** Calls a Swiggy tool and returns its JSON payload (structured content, or the first text block). */
export async function tool<T>(client: Client, name: string, args: Record<string, unknown>): Promise<T> {
  let res;
  try { res = await client.callTool({ name, arguments: args }); }
  catch (e) {
    if (e instanceof UnauthorizedError) throw new SwiggySignedOut();
    const msg = (e as Error).message ?? "";
    if (/429|rate/i.test(msg)) throw new HttpError(429, msg);
    throw e;
  }
  if (res.isError) throw new Error(`${name} failed: ${JSON.stringify(res.content).slice(0, 300)}`);
  if (res.structuredContent) return res.structuredContent as T;
  const text = (res.content as { type: string; text?: string }[]).find((c) => c.type === "text")?.text;
  if (!text) throw new Error(`${name} returned no content`);
  try { return JSON.parse(text) as T; } catch { throw new Error(`${name} returned non-JSON text: ${text.slice(0, 200)}`); }
}
