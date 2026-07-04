/**
 * It predicts whether a number is even, using a small neural network
 * trained on the number's binary representation instead of the trivial
 * `n % 2 === 0` rule.
 */

import * as tf from '@tensorflow/tfjs-node';
import {
  DEFAULT_BITS,
  EPOCHS_TRAIN_IS_EVEN,
  generateIsEvenTrainingData,
  maxValueForBits,
  toBinary,
} from './isEvenTestdata';

let model: tf.Sequential | null = null;

// Bits used for the current model. Numbers must be re-encoded with the same
// bit width used at training time, otherwise the input shape won't match.
let trainedBits: number = DEFAULT_BITS;

export interface IsEvenResult {
  isEven: boolean;
  /** Model confidence in the prediction, from 0.5 (unsure) to 1 (certain). */
  confidence: number;
}

/**
 * Trains the isEven skill on numbers encoded with the given bit width.
 * @param bits - How many bits to use to encode numbers, i.e. the model will
 *               only understand numbers in the range [0, 2^bits - 1].
 *               Defaults to 8 bits (range 0–255, 256 possible values), which
 *               is the recommended trade-off between range and training time.
 *               Up to 16 bits, every number in range is used for training,
 *               guaranteeing correct predictions. Beyond that, training data
 *               is sampled, so predictions are very likely but not
 *               guaranteed to be correct for every number.
 */
export const trainIsEven = async (bits: number = DEFAULT_BITS): Promise<void> => {
  trainedBits = bits;
  const { inputs, labels } = generateIsEvenTrainingData(bits);

  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [bits] }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: tf.train.adam(0.01), loss: 'binaryCrossentropy' });

  // A larger batch size keeps training fast even when there are tens of
  // thousands of rows (exhaustive training up to MAX_EXHAUSTIVE_BITS).
  const batchSize = Math.min(inputs.length, 512);
  await model.fit(xs, ys, { epochs: EPOCHS_TRAIN_IS_EVEN, batchSize });

  xs.dispose();
  ys.dispose();
};

export const useIsEven = async (x: number): Promise<IsEvenResult> => {
  if (!model) throw new Error('Skill isEven not trained yet. Run "train isEven" first.');

  const maxValue = maxValueForBits(trainedBits);
  if (!Number.isInteger(x) || x < 0 || x >= maxValue) {
    throw new Error(`Number out of range: expected an integer in [0, ${maxValue - 1}]`);
  }

  const input = tf.tensor2d([toBinary(x, trainedBits)]);
  const prediction = model.predict(input) as tf.Tensor;
  const value = (await prediction.data())[0];

  input.dispose();
  prediction.dispose();

  const isEven = value > 0.5;
  const confidence = isEven ? value : 1 - value;

  return { isEven, confidence };
};
