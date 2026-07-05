/** Max operand value used when generating random training pairs. */
export const MULTIPLY_MAX_OPERAND = 1_000;

/** Number of random (a, b) pairs for training. */
export const MULTIPLY_TRAINING_PAIRS = 1_000;

export const EPOCHS_TRAIN_MULTIPLY = 50;

export const MULTIPLY_TRAINING_SEED = 44;

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Builds random multiplication examples: [a, b] → a * b. */
export function generateMultiplyTrainingData(
  count: number = MULTIPLY_TRAINING_PAIRS,
  maxOperand: number = MULTIPLY_MAX_OPERAND,
  seed: number = MULTIPLY_TRAINING_SEED,
): { inputs: number[][]; outputs: number[] } {
  const inputs: number[][] = [];
  const outputs: number[] = [];
  const random = createRng(seed);

  const fixed: Array<[number, number]> = [
    [0, 0],
    [0, 5],
    [1, 1],
    [2, 3],
    [10, 4],
    [101, 99],
  ];

  for (const [a, b] of fixed) {
    inputs.push([a, b]);
    outputs.push(a * b);
  }

  for (let i = 0; i < count; i++) {
    const a = Math.floor(random() * (maxOperand + 1));
    const b = Math.floor(random() * (maxOperand + 1));
    inputs.push([a, b]);
    outputs.push(a * b);
  }

  return { inputs, outputs };
}
