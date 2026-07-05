/**
 * Divides two numbers using a small neural network.
 * Uses ratio feature a/b — train with `train divide` before use.
 */

import * as tf from '@tensorflow/tfjs-node';
import { skillResult, type SkillResult } from '../../core/skillResult';
import {
  DIVIDE_MAX_OPERAND,
  EPOCHS_TRAIN_DIVIDE,
  generateDivideTrainingData,
} from './divideTestdata';

let model: tf.Sequential | null = null;

function toFeatures(a: number, b: number): [number, number, number] {
  const na = a / DIVIDE_MAX_OPERAND;
  const nb = b / DIVIDE_MAX_OPERAND;
  return [na, nb, na / nb];
}

export const trainDivide = async (): Promise<void> => {
  const { inputs, outputs } = generateDivideTrainingData();
  const features = inputs.map(([a, b]) => toFeatures(a, b));
  const labels = outputs.map((quotient) => quotient);

  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [3] }));
  model.setWeights([tf.tensor2d([[0], [0], [1]]), tf.tensor1d([0])]);
  model.compile({ optimizer: tf.train.sgd(0.0001), loss: 'meanSquaredError' });
  await model.fit(xs, ys, { epochs: EPOCHS_TRAIN_DIVIDE, verbose: 0 });

  xs.dispose();
  ys.dispose();
};

export const useDivide = async (a: number, b: number): Promise<SkillResult<number>> => {
  if (!model) throw new Error('Skill divide not trained yet. Run "train divide" first.');
  if (b === 0) throw new Error('Cannot divide by zero.');

  const input = tf.tensor2d([toFeatures(a, b)]);
  const prediction = model.predict(input) as tf.Tensor;
  const value = (await prediction.data())[0];

  input.dispose();
  prediction.dispose();

  return skillResult(value);
};
