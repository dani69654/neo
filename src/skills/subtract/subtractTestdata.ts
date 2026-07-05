/** Max operand value used when generating random training pairs. */
export const SUBTRACT_MAX_OPERAND = 100_000;

/** Number of random (a, b) pairs for training. */
export const SUBTRACT_TRAINING_PAIRS = 1_000;

export const EPOCHS_TRAIN_SUBTRACT = 50;

/** Fixed seed so retraining gives consistent weights. */
export const SUBTRACT_TRAINING_SEED = 43;

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Builds random subtraction examples: [a, b] → a - b. */
export function generateSubtractTrainingData(
  count: number = SUBTRACT_TRAINING_PAIRS,
  maxOperand: number = SUBTRACT_MAX_OPERAND,
  seed: number = SUBTRACT_TRAINING_SEED,
): { inputs: number[][]; outputs: number[] } {
  const inputs: number[][] = [];
  const outputs: number[] = [];
  const random = createRng(seed);

  const fixed: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 4],
    [10, 3],
    [101, 98_723],
    [5, 10],
  ];

  for (const [a, b] of fixed) {
    inputs.push([a, b]);
    outputs.push(a - b);
  }

  for (let i = 0; i < count; i++) {
    const a = Math.floor(random() * (maxOperand + 1));
    const b = Math.floor(random() * (maxOperand + 1));
    inputs.push([a, b]);
    outputs.push(a - b);
  }

  return { inputs, outputs };
}
