/**
 * Loads the pretrained face-api.js models used by `recognizeFace`:
 * - SSD Mobilenet v1: locates faces in an arbitrary photo (real detection,
 *   not a heuristic crop).
 * - Face Landmark 68: aligns the detected face before describing it.
 * - Face Recognition Net: a ResNet-34-like network (weights trained by
 *   dlib, ~99.38% accuracy on LFW) that turns an aligned face into a
 *   128-value descriptor. Unlike a classifier trained from scratch on our
 *   tiny/heterogeneous dataset, this descriptor generalizes to any face,
 *   known or not, which is what makes reliable "unknown person" rejection
 *   possible.
 *
 * Model weight files ship inside the `@vladmandic/face-api` package itself,
 * so nothing needs to be downloaded separately.
 */

import * as path from 'path';
// Requiring tfjs-node registers and activates the 'tensorflow' backend as a
// side effect. face-api's NodeJS build requires this very same package
// internally, so both end up sharing the same global backend/engine.
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';

let modelsReady: Promise<void> | null = null;

function resolveModelsDir(): string {
  const pkgJsonPath = require.resolve('@vladmandic/face-api/package.json');
  return path.join(path.dirname(pkgJsonPath), 'model');
}

export function loadFaceApiModels(): Promise<void> {
  if (!modelsReady) {
    modelsReady = (async () => {
      await tf.ready();
      const modelsDir = resolveModelsDir();
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsDir);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsDir);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsDir);
    })();
  }
  return modelsReady;
}

export { faceapi };
