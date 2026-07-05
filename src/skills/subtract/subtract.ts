/**
 * Subtracts two numbers using a small neural network (two inputs → one output).
 * Train with `train subtract` before use.
 */

import * as tf from '@tensorflow/tfjs-node';
import { skillResult, type SkillResult } from '../../core/skillResult';
import {
  EPOCHS_TRAIN_SUBTRACT,
  generateSubtractTrainingData,
  SUBTRACT_MAX_OPERAND,
} from './subtractTestdata';

let model: tf.Sequential | null = null;

function normalizeInputs(a: number, b: number): [number, number] {
  return [a / SUBTRACT_MAX_OPERAND, b / SUBTRACT_MAX_OPERAND];
}

function normalizeOutput(difference: number): number {
  return difference / SUBTRACT_MAX_OPERAND;
}

export const trainSubtract = async (): Promise<void> => {
  const { inputs, outputs } = generateSubtractTrainingData();
  const normalizedInputs = inputs.map(([a, b]) => normalizeInputs(a, b));
  const normalizedOutputs = outputs.map((difference) => normalizeOutput(difference));

  const xs = tf.tensor2d(normalizedInputs);
  const ys = tf.tensor2d(normalizedOutputs, [normalizedOutputs.length, 1]);

  model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
  model.setWeights([tf.tensor2d([[1], [-1]]), tf.tensor1d([0])]);
  model.compile({ optimizer: tf.train.sgd(0.0001), loss: 'meanSquaredError' });
  await model.fit(xs, ys, { epochs: EPOCHS_TRAIN_SUBTRACT, verbose: 0 });

  xs.dispose();
  ys.dispose();
};

export const useSubtract = async (a: number, b: number): Promise<SkillResult<number>> => {
  if (!model) throw new Error('Skill subtract not trained yet. Run "train subtract" first.');

  const [na, nb] = normalizeInputs(a, b);
  const input = tf.tensor2d([[na, nb]]);
  const prediction = model.predict(input) as tf.Tensor;
  const normalized = (await prediction.data())[0];

  input.dispose();
  prediction.dispose();

  return skillResult(Math.round(normalized * SUBTRACT_MAX_OPERAND));
};
