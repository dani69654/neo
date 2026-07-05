import * as fs from 'fs';
import { DATA_DIR, NEO_STATE_FILE } from './paths';

export interface SkillState {
  trainedAt: string;
  /** Present for the isEven skill. */
  bits?: number;
}

export interface NeoState {
  version: 1;
  skills: Record<string, SkillState>;
}

const EMPTY_STATE: NeoState = { version: 1, skills: {} };

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadNeoState(): NeoState {
  if (!fs.existsSync(NEO_STATE_FILE)) return { version: 1, skills: {} };

  try {
    const parsed = JSON.parse(fs.readFileSync(NEO_STATE_FILE, 'utf8')) as NeoState;
    if (parsed.version !== 1 || typeof parsed.skills !== 'object') {
      return { version: 1, skills: {} };
    }
    return parsed;
  } catch {
    return { version: 1, skills: {} };
  }
}

export function saveNeoState(state: NeoState): void {
  ensureDataDir();
  fs.writeFileSync(NEO_STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function markSkillTrained(name: string, meta: Omit<SkillState, 'trainedAt'> = {}): void {
  const state = loadNeoState();
  state.skills[name] = { ...meta, trainedAt: new Date().toISOString() };
  saveNeoState(state);
}

export function getSkillState(name: string): SkillState | undefined {
  return loadNeoState().skills[name];
}
