/**
 * Loads the local peer network configuration from data/peers.json:
 * who this Neo is (name, port, token to accept), and which other Neo
 * instances it is allowed to talk to (name, url, token to send).
 */

import * as fs from 'fs';
import { PEERS_FILE } from './paths';

export interface PeerEntry {
  name: string;
  url: string;
  /** Bearer token this Neo must send when calling that peer. */
  token: string;
}

export interface PeerSelfConfig {
  name: string;
  port: number;
  /** Bearer token required from incoming requests. */
  token: string;
}

export interface PeerConfig {
  self: PeerSelfConfig;
  peers: PeerEntry[];
}

let cached: PeerConfig | null = null;

function readConfig(): PeerConfig {
  if (!fs.existsSync(PEERS_FILE)) {
    throw new Error(
      `No peer configuration found at data/peers.json. Copy data/peers.example.json to data/peers.json and edit it first.`,
    );
  }

  const parsed = JSON.parse(fs.readFileSync(PEERS_FILE, 'utf8')) as Partial<PeerConfig>;
  const self = parsed.self;
  if (!self?.name || !self.port || !self.token) {
    throw new Error('Invalid data/peers.json: "self" must have "name", "port" and "token".');
  }

  return { self, peers: parsed.peers ?? [] };
}

/** Loads (and caches) the peer configuration. */
export function loadPeerConfig(): PeerConfig {
  if (!cached) cached = readConfig();
  return cached;
}

/** Forces the next `loadPeerConfig` call to re-read the file from disk. */
export function reloadPeerConfig(): void {
  cached = null;
}

export function findPeer(name: string): PeerEntry {
  const { peers } = loadPeerConfig();
  const peer = peers.find((candidate) => candidate.name === name);
  if (!peer) {
    throw new Error(`Unknown peer "${name}". Check the "peers" list in data/peers.json.`);
  }
  return peer;
}

export function listPeerNames(): string[] {
  return loadPeerConfig().peers.map((peer) => peer.name);
}
