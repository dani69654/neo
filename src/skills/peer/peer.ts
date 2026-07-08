/**
 * Lets this Neo delegate a skill call to another Neo instance over HTTP.
 * Rule-based — no training required, just network I/O against a peer
 * registered in data/peers.json.
 */

import { findPeer } from '../../core/peerConfig';
import { skillResult, type SkillResult } from '../../core/skillResult';

interface PeerAskResponse {
  ok: boolean;
  result?: unknown;
  confidence?: number;
  error?: string;
}

/** Asks a known peer Neo to run `skillName(...args)` and returns its result. */
export const useAskPeer = async (
  peerName: unknown,
  skillName: unknown,
  ...args: unknown[]
): Promise<SkillResult<unknown>> => {
  if (typeof peerName !== 'string' || typeof skillName !== 'string') {
    throw new Error('Usage: askPeer(peerName, skillName, ...args)');
  }

  const peer = findPeer(peerName);

  let res: Response;
  try {
    res = await fetch(`${peer.url}/peer/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peer.token}`,
      },
      body: JSON.stringify({ skill: skillName, args }),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'network error';
    throw new Error(`Could not reach peer "${peerName}" at ${peer.url}: ${reason}`);
  }

  if (!res.ok) {
    throw new Error(`Peer "${peerName}" replied with HTTP ${res.status}.`);
  }

  const body = (await res.json()) as PeerAskResponse;
  if (!body.ok) {
    throw new Error(`Peer "${peerName}" could not run "${skillName}": ${body.error ?? 'unknown error'}`);
  }

  return skillResult(body.result, body.confidence ?? 1);
};
