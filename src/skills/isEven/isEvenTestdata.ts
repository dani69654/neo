/**
 * Number of bits used by default to encode a number in binary.
 * 8 bits covers the range 0–255 (256 values): enough for the network
 * to learn the even/odd pattern without making training too slow.
 */
export const DEFAULT_BITS = 8;

/**
 * Above this many bits, the range (2^bits) is too large to train on every
 * possible number in a reasonable time, so training falls back to sampling.
 * 16 bits (65536 numbers) still trains in a few seconds and guarantees the
 * model has seen (and can perfectly classify) every number in range.
 */
export const MAX_EXHAUSTIVE_BITS = 16;

export const TRAINING_SAMPLES = 2000;
export const EPOCHS_TRAIN_IS_EVEN = 100;

/** Largest number (exclusive) that can be encoded with the given number of bits. */
export function maxValueForBits(bits: number): number {
  return 2 ** bits;
}

/**
 * Encodes a number as an array of bits (most significant bit first),
 * padded to `bits` length. Example: toBinary(5, 4) -> [0, 1, 0, 1]
 */
export function toBinary(n: number, bits: number): number[] {
  return n
    .toString(2)
    .padStart(bits, '0')
    .split('')
    .map(Number);
}

/**
 * Samples numbers spread across every magnitude (i.e. every bit-length) up
 * to `maxValue`, not just uniformly at random.
 *
 * This matters once the range no longer fits in `generateIsEvenTrainingData`'s
 * exhaustive path: a plain uniform sample over a huge range almost never
 * produces "small" numbers (e.g. under 1000), since those are a tiny sliver
 * of the space. The model would then never see a number with many leading
 * zero bits during training, and could mispredict such numbers at query
 * time even though training loss looks perfect. Sampling per magnitude
 * bucket keeps every bit-length represented, including small numbers.
 */
function sampleAcrossMagnitudes(maxValue: number, count: number): number[] {
  const picked = new Set<number>();
  const bitLength = Math.ceil(Math.log2(maxValue));
  const perBucket = Math.max(1, Math.floor(count / (bitLength + 1)));

  for (let bucket = 0; bucket <= bitLength; bucket++) {
    const rangeStart = bucket === 0 ? 0 : 2 ** (bucket - 1);
    const rangeEnd = Math.min(2 ** bucket, maxValue);
    if (rangeStart >= rangeEnd) continue;

    for (let i = 0; i < perBucket; i++) {
      picked.add(rangeStart + Math.floor(Math.random() * (rangeEnd - rangeStart)));
    }
  }

  while (picked.size < Math.min(count, maxValue)) {
    picked.add(Math.floor(Math.random() * maxValue));
  }

  return Array.from(picked);
}

/**
 * Generates labeled training data: binary-encoded numbers paired with
 * their even/odd label (1 = even, 0 = odd).
 *
 * Up to `MAX_EXHAUSTIVE_BITS`, every number in range is used exactly once,
 * which guarantees the model can classify any number correctly. Beyond
 * that, numbers are sampled across magnitudes to keep training fast while
 * still covering small and large numbers alike.
 */
export function generateIsEvenTrainingData(
  bits: number = DEFAULT_BITS,
  samples: number = TRAINING_SAMPLES,
): { inputs: number[][]; labels: number[] } {
  const maxValue = maxValueForBits(bits);
  const numbers =
    bits <= MAX_EXHAUSTIVE_BITS
      ? Array.from({ length: maxValue }, (_, n) => n)
      : sampleAcrossMagnitudes(maxValue, samples);

  const inputs = numbers.map((n) => toBinary(n, bits));
  const labels = numbers.map((n) => (n % 2 === 0 ? 1 : 0));

  return { inputs, labels };
}
