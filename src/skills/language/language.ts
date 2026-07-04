/**
 * It parses free-form English text into an intent Neo can act on (e.g.
 * "double 21" -> use the "double" skill with argument 21), using a small
 * neural network trained on bag-of-words encoded sentences.
 */

import * as tf from '@tensorflow/tfjs-node';
import {
  type Intent,
  INTENTS,
  LANGUAGE_TRAINING_DATA,
  buildVocabulary,
  extractNumbers,
  intentToVector,
  textToVector,
} from './languageTestdata';
import { evaluateChainExpression, parseMathExpression } from './mathParser';

const EPOCHS_TRAIN_LANGUAGE = 300;

/** Intents that need numbers extracted from the user's text. */
const INTENTS_WITH_NUMBERS: ReadonlySet<Intent> = new Set([
  'double',
  'isEven',
  'add',
  'subtract',
  'multiply',
  'divide',
]);

let model: tf.Sequential | null = null;

// Vocabulary used at training time. Text must be re-encoded with this same
// vocabulary at inference time, otherwise the input shape won't match.
let vocabulary: string[] = [];

export interface ParsedCommand {
  intent: Intent;
  /** Numbers found in the text, in order. */
  numbers: number[];
  /** Model confidence in the predicted intent, from 0 to 1. */
  confidence: number;
  /** Set when the input is a multi-step inline expression such as "1 + 4 - 3". */
  chainEval?: { display: string; result: number };
}

/**
 * Trains the language skill on `LANGUAGE_TRAINING_DATA`: a bag-of-words
 * classifier that maps a sentence to one of `INTENTS`.
 */
export const trainLanguage = async (): Promise<void> => {
  vocabulary = buildVocabulary(LANGUAGE_TRAINING_DATA);

  const inputs = LANGUAGE_TRAINING_DATA.map((example) => textToVector(example.text, vocabulary));
  const labels = LANGUAGE_TRAINING_DATA.map((example) => intentToVector(example.intent));

  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(labels);

  model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [vocabulary.length] }));
  model.add(tf.layers.dense({ units: INTENTS.length, activation: 'softmax' }));
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  await model.fit(xs, ys, { epochs: EPOCHS_TRAIN_LANGUAGE, verbose: 0 });

  xs.dispose();
  ys.dispose();
};

export function isLanguageTrained(): boolean {
  return model !== null;
}

/**
 * Parses `text` into an intent (with confidence) and any numbers found in it.
 */
export const useLanguage = async (text: string): Promise<ParsedCommand> => {
  if (!model) throw new Error('Skill language not trained yet. Run "train language" first.');

  const chain = evaluateChainExpression(text);
  if (chain) {
    return { intent: 'add', numbers: [], confidence: 1, chainEval: chain };
  }

  const math = parseMathExpression(text);
  if (math) {
    return { intent: math.intent, numbers: [...math.numbers], confidence: 1 };
  }

  const vector = textToVector(text, vocabulary);
  const input = tf.tensor2d([vector]);
  const prediction = model.predict(input) as tf.Tensor;
  const probabilities = await prediction.data();

  input.dispose();
  prediction.dispose();

  let bestIndex = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[bestIndex]) bestIndex = i;
  }

  const intent = INTENTS[bestIndex];
  const confidence = probabilities[bestIndex];
  const numbers = INTENTS_WITH_NUMBERS.has(intent) ? extractNumbers(text) : [];

  return { intent, numbers, confidence };
};
