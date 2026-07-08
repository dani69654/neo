/**
 * Exposes this Neo over HTTP so other Neo instances can ask it to run a
 * skill (`POST /peer/ask`). Requests must carry the bearer token configured
 * in data/peers.json ("self.token"); everything else is rejected.
 */

import * as http from 'http';
import type { AddressInfo } from 'net';
import type { Neo } from './Neo';
import { ensureSkill } from './skillBootstrap';
import { loadPeerConfig } from './peerConfig';
import { normalizeSkillResult } from './skillResult';

interface PeerAskBody {
  skill?: string;
  args?: unknown[];
}

let server: http.Server | null = null;

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handleAsk(neo: Neo, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  let body: PeerAskBody;
  try {
    body = JSON.parse((await readBody(req)) || '{}') as PeerAskBody;
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON body.' });
    return;
  }

  if (!body.skill) {
    sendJson(res, 400, { ok: false, error: 'Missing "skill" in request body.' });
    return;
  }

  try {
    await ensureSkill(neo, body.skill);
    const raw = await neo.use(body.skill, ...(body.args ?? []));
    const { result, confidence } = normalizeSkillResult(raw);
    sendJson(res, 200, { ok: true, result, confidence });
  } catch (err) {
    sendJson(res, 200, { ok: false, error: err instanceof Error ? err.message : 'Skill failed.' });
  }
}

/** Starts the peer HTTP server (idempotent — returns the existing port if already running). */
export function startPeerServer(neo: Neo): Promise<number> {
  if (server) return Promise.resolve((server.address() as AddressInfo).port);

  const { self } = loadPeerConfig();

  return new Promise((resolve, reject) => {
    const instance = http.createServer((req, res) => {
      if (req.method !== 'POST' || req.url !== '/peer/ask') {
        sendJson(res, 404, { ok: false, error: 'Not found.' });
        return;
      }

      if (req.headers.authorization !== `Bearer ${self.token}`) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
        return;
      }

      handleAsk(neo, req, res).catch((err) => {
        sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : 'Internal error.' });
      });
    });

    instance.once('error', reject);
    instance.listen(self.port, () => {
      server = instance;
      resolve(self.port);
    });
  });
}

export function stopPeerServer(): Promise<void> {
  if (!server) return Promise.resolve();
  const instance = server;
  server = null;
  return new Promise((resolve, reject) => {
    instance.close((err) => (err ? reject(err) : resolve()));
  });
}

export function isPeerServerRunning(): boolean {
  return server !== null;
}
