/**
 * Multiplies two numbers using a small neural network.
 * Uses product feature a×b (non-linear) — train with `train multiply` before use.
 */

import * as tf from '@tensorflow/tfjs-node';
import { loadLayersModel, saveLayersModel } from '../../core/modelStore';
import { skillResult, type SkillResult } from '../../core/skillResult';
import {
  EPOCHS_TRAIN_MULTIPLY,
  generateMultiplyTrainingData,
  MULTIPLY_MAX_OPERAND,
} from './multiplyTestdata';

let model: tf.Sequential | null = null;

function toFeatures(a: number, b: number): [number, number, number] {
  const na = a / MULTIPLY_MAX_OPERAND;
  const nb = b / MULTIPLY_MAX_OPERAND;
  return [na, nb, na * nb];
}

function normalizeProduct(product: number): number {
  return product / (MULTIPLY_MAX_OPERAND * MULTIPLY_MAX_OPERAND);
}

export const trainMultiply = async (): Promise<void> => {
  const { inputs, outputs } = generateMultiplyTrainingData();
  const features = inputs.map(([a, b]) => toFeatures(a, b));
  const labels = outputs.map((product) => normalizeProduct(product));

  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [3] }));
  model.setWeights([tf.tensor2d([[0], [0], [1]]), tf.tensor1d([0])]);
  model.compile({ optimizer: tf.train.sgd(0.0001), loss: 'meanSquaredError' });
  await model.fit(xs, ys, { epochs: EPOCHS_TRAIN_MULTIPLY, verbose: 0 });

  xs.dispose();
  ys.dispose();
};

export async function loadMultiplyModel(): Promise<boolean> {
  if (model) return true;
  const loaded = await loadLayersModel('multiply');
  if (!loaded) return false;
  model = loaded as tf.Sequential;
  return true;
}

export async function saveMultiplyModel(): Promise<void> {
  if (!model) return;
  await saveLayersModel('multiply', model);
}

export const useMultiply = async (a: number, b: number): Promise<SkillResult<number>> => {
  if (!model) throw new Error('Skill multiply not trained yet. Run "train multiply" first.');

  const input = tf.tensor2d([toFeatures(a, b)]);
  const prediction = model.predict(input) as tf.Tensor;
  const normalized = (await prediction.data())[0];
  const scale = MULTIPLY_MAX_OPERAND * MULTIPLY_MAX_OPERAND;

  input.dispose();
  prediction.dispose();

  return skillResult(Math.round(normalized * scale));
};
