import * as fs from 'fs';
import * as path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import { modelDir } from './paths';

function ensureModelDir(skillName: string): string {
  const dir = modelDir(skillName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function hasSavedModel(skillName: string): boolean {
  return fs.existsSync(path.join(modelDir(skillName), 'model.json'));
}

export async function saveLayersModel(skillName: string, model: tf.LayersModel): Promise<void> {
  await model.save(`file://${ensureModelDir(skillName)}`);
}

export async function loadLayersModel(skillName: string): Promise<tf.LayersModel | null> {
  const modelPath = path.join(modelDir(skillName), 'model.json');
  if (!fs.existsSync(modelPath)) return null;
  return tf.loadLayersModel(`file://${modelPath}`);
}

export function saveJson(skillName: string, fileName: string, data: unknown): void {
  fs.writeFileSync(
    path.join(ensureModelDir(skillName), fileName),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8',
  );
}

export function loadJson<T>(skillName: string, fileName: string): T | null {
  const filePath = path.join(modelDir(skillName), fileName);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}
