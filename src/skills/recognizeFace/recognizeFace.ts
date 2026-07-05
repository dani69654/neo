/**
 * Recognizes faces using pretrained face-api.js models: real face detection
 * (SSD Mobilenet v1) + a pretrained 128-value face descriptor (dlib's
 * ResNet-34 face recognition net, ~99.38% on LFW).
 *
 * Unlike a small CNN classifier trained from scratch on our tiny/heterogeneous
 * photo set, this descriptor is trained to separate ANY two faces, known or
 * not — which is exactly what open-set "is this a known person?" rejection
 * needs. Training here means "compute a descriptor per training photo",
 * there is no gradient descent / weight learning involved.
 *
 * Train on folders under `data/faces/<person>/` — any normal-sized photos
 * work, no preset dataset needed.
 */

import * as tf from '@tensorflow/tfjs-node';
import { loadJson, saveJson } from '../../core/modelStore';
import { skillResult, type SkillResult } from '../../core/skillResult';
import { readImageBuffer, requireFaceSamples } from './faceDataset';
import { faceapi, loadFaceApiModels } from './faceApiModels';
import { FACE_MATCH_THRESHOLD, MIN_FACE_CONFIDENCE } from './recognizeFaceTestdata';

// face-api bundles its own copy of the tfjs-core type declarations, so its
// `Tensor3D` is nominally different from `@tensorflow/tfjs-node`'s — even
// though at runtime they are the exact same class (face-api's NodeJS build
// requires `@tensorflow/tfjs-node` internally). This cast bridges the two
// type realms; it does not change what's happening at runtime.
type FaceApiInput = Parameters<typeof faceapi.detectSingleFace>[0];

const DETECTOR_OPTIONS = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 });

let matcher: InstanceType<typeof faceapi.FaceMatcher> | null = null;

export interface RecognizeFaceValue {
  name: string;
  /** True when the face does not match anyone in the training gallery. */
  unknown?: boolean;
  /** True when the match is close to the decision boundary. */
  uncertain?: boolean;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

async function computeDescriptor(imagePath: string): Promise<Float32Array | null> {
  const buffer = readImageBuffer(imagePath);
  const tensor = tf.node.decodeImage(buffer, 3) as tf.Tensor3D;
  try {
    const result = await faceapi
      .detectSingleFace(tensor as unknown as FaceApiInput, DETECTOR_OPTIONS)
      .withFaceLandmarks()
      .withFaceDescriptor();
    return result?.descriptor ?? null;
  } finally {
    tensor.dispose();
  }
}

export const trainRecognizeFace = async (): Promise<void> => {
  await loadFaceApiModels();
  const samples = requireFaceSamples();

  const byLabel = new Map<string, Float32Array[]>();
  let skipped = 0;
  for (const sample of samples) {
    const descriptor = await computeDescriptor(sample.filePath);
    if (!descriptor) {
      skipped++;
      continue;
    }
    const bucket = byLabel.get(sample.label) ?? [];
    bucket.push(descriptor);
    byLabel.set(sample.label, bucket);
  }

  if (skipped > 0) {
    console.warn(
      `recognizeFace: no face detected in ${skipped}/${samples.length} photo(s) — skipped. ` +
        'Very small, blurry, or heavily cropped images are often below what a real-photo face ' +
        'detector can find; use normal-sized photos for reliable recognition.',
    );
  }

  const labeled = [...byLabel.entries()]
    .filter(([, descriptors]) => descriptors.length > 0)
    .map(([label, descriptors]) => new faceapi.LabeledFaceDescriptors(label, descriptors));

  if (labeled.length === 0) {
    throw new Error('No face could be detected in any training photo under data/faces/.');
  }

  matcher = new faceapi.FaceMatcher(labeled, FACE_MATCH_THRESHOLD);
};

export async function loadRecognizeFaceModel(): Promise<boolean> {
  if (matcher) return true;
  const savedMatcher = loadJson<Record<string, unknown>>('recognizeFace', 'matcher.json');
  if (!savedMatcher) return false;

  await loadFaceApiModels();
  matcher = faceapi.FaceMatcher.fromJSON(savedMatcher);
  return true;
}

export async function saveRecognizeFaceModel(): Promise<void> {
  if (!matcher) return;
  saveJson('recognizeFace', 'matcher.json', matcher.toJSON());
}

/**
 * Nearest-neighbor match across every individual training photo, rather than
 * face-api's default "mean distance across all of a label's photos". With
 * only a handful of real-world photos per person (often shot at very
 * different angles/crops/quality), averaging drags a good match down because
 * of the noisiest photo in the set; taking the single closest photo is more
 * robust for small, heterogeneous galleries.
 */
function findNearestMatch(
  activeMatcher: InstanceType<typeof faceapi.FaceMatcher>,
  descriptor: Float32Array,
): { label: string; distance: number } {
  let bestLabel = 'unknown';
  let bestDistance = Infinity;

  for (const { label, descriptors } of activeMatcher.labeledDescriptors) {
    for (const known of descriptors) {
      const distance = faceapi.euclideanDistance(known, descriptor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestLabel = label;
      }
    }
  }

  return { label: bestLabel, distance: bestDistance };
}

export const useRecognizeFace = async (imagePath: string): Promise<SkillResult<RecognizeFaceValue>> => {
  if (!matcher) {
    throw new Error('Skill recognizeFace not trained yet. Run "train recognizeFace" first.');
  }

  await loadFaceApiModels();
  const descriptor = await computeDescriptor(imagePath);
  if (!descriptor) {
    throw new Error('No face detected in the image.');
  }

  const { label, distance } = findNearestMatch(matcher, descriptor);
  const confidence = clamp01(1 - distance / matcher.distanceThreshold);

  if (distance > matcher.distanceThreshold) {
    return skillResult({ name: 'unknown', unknown: true }, 0);
  }

  if (confidence < MIN_FACE_CONFIDENCE) {
    return skillResult({ name: label, uncertain: true }, confidence);
  }

  return skillResult({ name: label }, confidence);
};
