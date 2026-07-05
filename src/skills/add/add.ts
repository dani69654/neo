/**
 * Adds two numbers using a small neural network (two inputs → one output).
 * Train with `train add` before use.
 */

import * as tf from '@tensorflow/tfjs-node';
import { skillResult, type SkillResult } from '../../core/skillResult';
import { ADD_MAX_OPERAND, EPOCHS_TRAIN_ADD, generateAddTrainingData } from './addTestdata';

let model: tf.Sequential | null = null;

function normalizeInputs(a: number, b: number): [number, number] {
  return [a / ADD_MAX_OPERAND, b / ADD_MAX_OPERAND];
}

function normalizeOutput(sum: number): number {
  return sum / ADD_MAX_OPERAND;
}

export const trainAdd = async (): Promise<void> => {
  const { inputs, outputs } = generateAddTrainingData();
  const normalizedInputs = inputs.map(([a, b]) => normalizeInputs(a, b));
  const normalizedOutputs = outputs.map((sum) => normalizeOutput(sum));

  const xs = tf.tensor2d(normalizedInputs);
  const ys = tf.tensor2d(normalizedOutputs, [normalizedOutputs.length, 1]);

  model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: 1,
      inputShape: [2],
      kernelInitializer: 'ones',
      biasInitializer: 'zeros',
    }),
  );
  model.compile({ optimizer: tf.train.sgd(0.0001), loss: 'meanSquaredError' });
  // Light fine-tune from a = b = 1 init (exact addition on normalized inputs).
  await model.fit(xs, ys, { epochs: EPOCHS_TRAIN_ADD, verbose: 0 });

  xs.dispose();
  ys.dispose();
};

export const useAdd = async (a: number, b: number): Promise<SkillResult<number>> => {
  if (!model) throw new Error('Skill add not trained yet. Run "train add" first.');

  const [na, nb] = normalizeInputs(a, b);
  const input = tf.tensor2d([[na, nb]]);
  const prediction = model.predict(input) as tf.Tensor;
  const normalized = (await prediction.data())[0];

  input.dispose();
  prediction.dispose();

  return skillResult(Math.round(normalized * ADD_MAX_OPERAND));
};
