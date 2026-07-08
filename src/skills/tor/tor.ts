/**
 * Routes every outbound request Neo makes through the Tor network.
 *
 * This skill is rule-based (no training). It exposes {@link torFetch}, which
 * is meant to be the *single* gateway any other skill uses to talk to the
 * internet: it forces all traffic through Tor's local SOCKS proxy, so Neo's
 * real IP is never exposed. DNS is resolved by Tor as well (the `socks5h`
 * scheme), preventing DNS leaks that would otherwise reveal browsing activity.
 *
 * It assumes a Tor daemon is running locally and listening on its SOCKS port
 * (127.0.0.1:9050 by default, or the Tor Browser's 127.0.0.1:9150). Override
 * the address with the TOR_SOCKS_PROXY environment variable.
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { skillResult, type SkillResult } from '../../core/skillResult';

/** Default local Tor SOCKS proxy. `socks5h` makes Tor resolve DNS too (no leaks). */
export const DEFAULT_TOR_PROXY = 'socks5h://127.0.0.1:9050';

/** Endpoint that reports whether the request actually came out of a Tor exit node. */
const TOR_CHECK_URL = 'https://check.torproject.org/api/ip';

const TOR_USER_AGENT = 'neo-tor-skill/1.0';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_REDIRECTS = 5;
const BODY_PREVIEW_CHARS = 500;

/** Address of the Tor SOCKS proxy, overridable via TOR_SOCKS_PROXY. */
export function getTorProxyUrl(): string {
  const fromEnv = process.env.TOR_SOCKS_PROXY?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_TOR_PROXY;
}

let cachedAgent: { proxy: string; agent: SocksProxyAgent } | null = null;

/** Shared SOCKS agent pointing at the Tor proxy (rebuilt if the address changes). */
export function torAgent(): SocksProxyAgent {
  const proxy = getTorProxyUrl();
  if (!cachedAgent || cachedAgent.proxy !== proxy) {
    cachedAgent = { proxy, agent: new SocksProxyAgent(proxy) };
  }
  return cachedAgent.agent;
}

export interface TorRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxRedirects?: number;
}

export interface TorResponse {
  status: number;
  statusText: string;
  headers: http.IncomingHttpHeaders;
  body: string;
  /** Final URL after following any redirects. */
  url: string;
}

export interface TorStatus {
  isTor: boolean;
  ip: string;
  proxy: string;
}

/** Adds `https://` when the user typed a bare host like `example.com`. */
function normalizeUrl(input: string): string {
  return /^[a-z]+:\/\//i.test(input) ? input : `https://${input}`;
}

/** Turns low-level socket errors into an explanation the user can act on. */
function torErrorMessage(err: unknown, proxy: string): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|closed|refused/i.test(message)) {
    return (
      `Could not reach the Tor proxy at ${proxy}. ` +
      'Is Tor running? Start the Tor daemon (e.g. "tor" or "brew services start tor"), ' +
      'or set TOR_SOCKS_PROXY to the right address (Tor Browser uses socks5h://127.0.0.1:9150).'
    );
  }
  return `Tor request failed: ${message}`;
}

function requestThroughTor(
  rawUrl: string,
  options: TorRequestOptions,
  redirectsLeft: number,
): Promise<TorResponse> {
  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      reject(new Error(`Invalid URL: ${rawUrl}`));
      return;
    }

    const isHttps = parsed.protocol === 'https:';
    if (!isHttps && parsed.protocol !== 'http:') {
      reject(new Error(`Unsupported protocol "${parsed.protocol}" — only http and https go through Tor.`));
      return;
    }

    const transport = isHttps ? https : http;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const req = transport.request(
      parsed,
      {
        method: options.method ?? 'GET',
        // agent-base's Agent works as an http.Agent at runtime but isn't structurally typed as one.
        agent: torAgent() as unknown as http.Agent,
        headers: { 'user-agent': TOR_USER_AGENT, ...options.headers },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;

        if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
          res.resume();
          const next = new URL(location, parsed).toString();
          requestThroughTor(next, { ...options, body: undefined }, redirectsLeft - 1).then(resolve, reject);
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status,
            statusText: res.statusMessage ?? '',
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
            url: parsed.toString(),
          });
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request to ${parsed.host} timed out after ${timeoutMs}ms.`));
    });
    req.on('error', (err) => reject(err));

    if (options.body !== undefined) req.write(options.body);
    req.end();
  });
}

/**
 * Fetches a URL through Tor. Every skill that needs the internet should call
 * this instead of Node's global `fetch`/`http`, so nothing ever bypasses Tor.
 */
export function torFetch(url: string, options: TorRequestOptions = {}): Promise<TorResponse> {
  return requestThroughTor(
    normalizeUrl(url),
    options,
    options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
  );
}

/** Asks the Tor Project whether Neo's traffic is actually exiting through Tor. */
export async function checkTorConnection(): Promise<TorStatus> {
  const res = await torFetch(TOR_CHECK_URL, { timeoutMs: 20_000 });
  const data = JSON.parse(res.body) as { IsTor?: boolean; IP?: string };
  return {
    isTor: Boolean(data.IsTor),
    ip: data.IP ?? 'unknown',
    proxy: getTorProxyUrl(),
  };
}

/**
 * Skill entry point.
 *
 * - `use('tor')` verifies Neo is connected to Tor and reports the exit-node IP.
 * - `use('tor', 'example.com')` fetches a page through Tor and returns a preview.
 */
export const useTor = async (target?: unknown): Promise<SkillResult<string>> => {
  const proxy = getTorProxyUrl();

  if (typeof target === 'string' && target.trim().length > 0) {
    try {
      const res = await torFetch(target.trim());
      const preview = res.body.slice(0, BODY_PREVIEW_CHARS);
      return skillResult(
        [
          `Fetched ${res.url} through Tor (${proxy}).`,
          `Status: ${res.status} ${res.statusText}`.trim(),
          '',
          preview,
        ].join('\n'),
      );
    } catch (err) {
      return skillResult(torErrorMessage(err, proxy), 0);
    }
  }

  try {
    const status = await checkTorConnection();
    if (status.isTor) {
      return skillResult(
        `Connected to Tor via ${status.proxy}. Exit-node IP: ${status.ip}. ` +
          "All of Neo's internet traffic is now routed through the Tor network.",
      );
    }
    return skillResult(
      `Reached the internet via ${status.proxy}, but this is NOT a Tor connection ` +
        `(observed IP: ${status.ip}). Point TOR_SOCKS_PROXY at a running Tor daemon.`,
      0,
    );
  } catch (err) {
    return skillResult(torErrorMessage(err, proxy), 0);
  }
};
