import * as path from 'path';

/** Root folder for Neo runtime data (models, state). */
export const DATA_DIR = path.resolve(process.cwd(), 'data');

export const MODELS_DIR = path.join(DATA_DIR, 'models');

export const NEO_STATE_FILE = path.join(DATA_DIR, 'neo-state.json');

export function modelDir(skillName: string): string {
  return path.join(MODELS_DIR, skillName);
}
