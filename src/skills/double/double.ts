/** 
 * It doubles a number (y = 2 * x).
 * @param x - The number to double.
 * @returns The doubled number.
 */

import { DOUBLE_TEST_DATA, EPOCHS_TRAIN_DOUBLE } from './doubleTestdata';
import * as tf from '@tensorflow/tfjs-node';

let model: tf.Sequential | null = null;

export const trainDouble = async (): Promise<void> => {
  model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  model.compile({ optimizer: tf.train.sgd(0.01), loss: 'meanSquaredError' });
  await model.fit(
    tf.tensor1d(DOUBLE_TEST_DATA.inputs),
    tf.tensor1d(DOUBLE_TEST_DATA.outputs),
    { epochs: EPOCHS_TRAIN_DOUBLE },
  );
};

export const useDouble = async (x: number): Promise<number> => {
  if (!model) throw new Error('Skill double not trained yet. Run "train double" first.');
  const result = model.predict(tf.tensor2d([x], [1, 1])) as tf.Tensor;
  const value = result.dataSync()[0];
  result.dispose();
  return value;
};