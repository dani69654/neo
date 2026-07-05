/** Max dividend used when generating random training pairs. */
export const DIVIDE_MAX_OPERAND = 10_000;

/** Number of random (a, b) pairs for training (divisor always ≥ 1). */
export const DIVIDE_TRAINING_PAIRS = 1_000;

export const EPOCHS_TRAIN_DIVIDE = 50;

export const DIVIDE_TRAINING_SEED = 45;

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Builds random division examples: [a, b] → a / b (b ≥ 1). */
export function generateDivideTrainingData(
  count: number = DIVIDE_TRAINING_PAIRS,
  maxOperand: number = DIVIDE_MAX_OPERAND,
  seed: number = DIVIDE_TRAINING_SEED,
): { inputs: number[][]; outputs: number[] } {
  const inputs: number[][] = [];
  const outputs: number[] = [];
  const random = createRng(seed);

  const fixed: Array<[number, number]> = [
    [0, 1],
    [10, 2],
    [10, 4],
    [20, 5],
    [99, 11],
    [100, 25],
  ];

  for (const [a, b] of fixed) {
    inputs.push([a, b]);
    outputs.push(a / b);
  }

  for (let i = 0; i < count; i++) {
    const a = Math.floor(random() * (maxOperand + 1));
    const b = Math.floor(random() * maxOperand) + 1;
    inputs.push([a, b]);
    outputs.push(a / b);
  }

  return { inputs, outputs };
}
