import { createRng } from '../../utils/createRng';

/** Max dividend used when generating random training pairs. */
export const MOD_MAX_OPERAND = 10_000;

/** Number of random (a, b) pairs for training (modulus always ≥ 1). */
export const MOD_TRAINING_PAIRS = 1_000;

export const EPOCHS_TRAIN_MOD = 50;

export const MOD_TRAINING_SEED = 46;

/** Builds random modulo examples: [a, b] → a % b (b ≥ 1). */
export function generateModTrainingData(
  count: number = MOD_TRAINING_PAIRS,
  maxOperand: number = MOD_MAX_OPERAND,
  seed: number = MOD_TRAINING_SEED,
): { inputs: number[][]; outputs: number[] } {
  const inputs: number[][] = [];
  const outputs: number[] = [];
  const random = createRng(seed);

  const fixed: Array<[number, number]> = [
    [0, 1],
    [10, 3],
    [20, 4],
    [17, 5],
    [100, 7],
    [99, 10],
  ];

  for (const [a, b] of fixed) {
    inputs.push([a, b]);
    outputs.push(a % b);
  }

  for (let i = 0; i < count; i++) {
    const a = Math.floor(random() * (maxOperand + 1));
    const b = Math.floor(random() * maxOperand) + 1;
    inputs.push([a, b]);
    outputs.push(a % b);
  }

  return { inputs, outputs };
}
