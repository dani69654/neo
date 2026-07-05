import * as fs from 'fs';
import * as path from 'path';
import { FACES_DIR } from '../../core/paths';

export interface FaceSample {
  label: string;
  filePath: string;
}

/** Lists all face images under `data/faces/<label>/`. */
export function listFaceSamples(facesDir: string = FACES_DIR): FaceSample[] {
  if (!fs.existsSync(facesDir)) return [];

  const samples: FaceSample[] = [];
  const labelDirs = fs
    .readdirSync(facesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const label of labelDirs) {
    const dir = path.join(facesDir, label);
    const files = fs
      .readdirSync(dir)
      .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
      .sort();

    for (const file of files) {
      samples.push({ label, filePath: path.join(dir, file) });
    }
  }

  return samples;
}

export function requireFaceSamples(facesDir: string = FACES_DIR): FaceSample[] {
  const samples = listFaceSamples(facesDir);
  if (samples.length === 0) {
    throw new Error('No face images found. Add photos under data/faces/<name>/.');
  }
  return samples;
}

/** Reads an image file's raw bytes, ready to be decoded by face-api's own tf instance. */
export function readImageBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}
