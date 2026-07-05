import { createRng } from '../../utils/createRng';

/** Max operand value used when generating random training pairs. */
export const ADD_MAX_OPERAND = 100_000;

/** Number of random (a, b) pairs for training. */
export const ADD_TRAINING_PAIRS = 1_000;

export const EPOCHS_TRAIN_ADD = 50;

/** Fixed seed so retraining gives consistent weights. */
export const ADD_TRAINING_SEED = 42;

/** Builds random addition examples: [a, b] → a + b. */
export function generateAddTrainingData(
  count: number = ADD_TRAINING_PAIRS,
  maxOperand: number = ADD_MAX_OPERAND,
  seed: number = ADD_TRAINING_SEED,
): { inputs: number[][]; outputs: number[] } {
  const inputs: number[][] = [];
  const outputs: number[] = [];
  const random = createRng(seed);

  const fixed: Array<[number, number]> = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1],
    [2, 2],
    [3, 4],
    [101, 98_723],
  ];

  for (const [a, b] of fixed) {
    inputs.push([a, b]);
    outputs.push(a + b);
  }

  for (let i = 0; i < count; i++) {
    const a = Math.floor(random() * (maxOperand + 1));
    const b = Math.floor(random() * (maxOperand + 1));
    inputs.push([a, b]);
    outputs.push(a + b);
  }

  return { inputs, outputs };
}
