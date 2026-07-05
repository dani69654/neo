/**
 * Modulo of two numbers using a small neural network.
 * Uses remainder feature a % b — train with `train mod` before use.
 */

import * as tf from '@tensorflow/tfjs-node';
import { loadLayersModel, saveLayersModel } from '../../core/modelStore';
import { skillResult, type SkillResult } from '../../core/skillResult';
import {
  EPOCHS_TRAIN_MOD,
  generateModTrainingData,
  MOD_MAX_OPERAND,
} from './modTestdata';

let model: tf.Sequential | null = null;

function toFeatures(a: number, b: number): [number, number, number] {
  const na = a / MOD_MAX_OPERAND;
  const nb = b / MOD_MAX_OPERAND;
  return [na, nb, a % b];
}

export const trainMod = async (): Promise<void> => {
  const { inputs, outputs } = generateModTrainingData();
  const features = inputs.map(([a, b]) => toFeatures(a, b));
  const labels = outputs.map((remainder) => remainder);

  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [3] }));
  model.setWeights([tf.tensor2d([[0], [0], [1]]), tf.tensor1d([0])]);
  model.compile({ optimizer: tf.train.sgd(0.0001), loss: 'meanSquaredError' });
  await model.fit(xs, ys, { epochs: EPOCHS_TRAIN_MOD, verbose: 0 });

  xs.dispose();
  ys.dispose();
};

export async function loadModModel(): Promise<boolean> {
  if (model) return true;
  const loaded = await loadLayersModel('mod');
  if (!loaded) return false;
  model = loaded as tf.Sequential;
  return true;
}

export async function saveModModel(): Promise<void> {
  if (!model) return;
  await saveLayersModel('mod', model);
}

export const useMod = async (a: number, b: number): Promise<SkillResult<number>> => {
  if (!model) throw new Error('Skill mod not trained yet. Run "train mod" first.');
  if (b === 0) throw new Error('Cannot modulo by zero.');

  const input = tf.tensor2d([toFeatures(a, b)]);
  const prediction = model.predict(input) as tf.Tensor;
  const value = (await prediction.data())[0];

  input.dispose();
  prediction.dispose();

  return skillResult(Math.round(value));
};
