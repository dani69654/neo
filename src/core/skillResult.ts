/**
 * Standard shape for every Neo skill return value.
 *
 * @example
 * skillResult(42)                    // deterministic → confidence 1
 * skillResult('even', 0.97)          // ML prediction with model confidence
 */

/** Confidence in the result, from 0 to 1 (1 = fully certain). */
export const CERTAIN = 1;

export interface SkillResult<T = unknown> {
  result: T;
  confidence: number;
}

export function skillResult<T>(result: T, confidence: number = CERTAIN): SkillResult<T> {
  return { result, confidence };
}

export function isSkillResult(value: unknown): value is SkillResult {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as SkillResult;
  return 'result' in candidate && typeof candidate.confidence === 'number';
}

/** Wraps a raw value if it is not already a {@link SkillResult}. */
export function normalizeSkillResult<T>(value: T | SkillResult<T>): SkillResult<T> {
  if (isSkillResult(value)) return value as SkillResult<T>;
  return skillResult(value);
}

export function unwrapResult<T>(value: T | SkillResult<T>): T {
  return isSkillResult(value) ? (value.result as T) : value;
}

export function unwrapConfidence(value: unknown): number {
  return isSkillResult(value) ? value.confidence : CERTAIN;
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

/** Appends a confidence label for human-readable CLI / chat output. */
export function confidenceSuffix(confidence: number): string {
  return ` (confidence: ${formatConfidence(confidence)})`;
}

/** JSON snapshot of a skill return value. */
export function toSkillResultJson(value: unknown): string {
  return JSON.stringify(normalizeSkillResult(value));
}

/** Plain-text rendering of a skill return value (always includes confidence). */
export function formatSkillResult(value: unknown): string {
  const { result, confidence } = normalizeSkillResult(value);

  if (typeof result === 'object' && result !== null && 'isEven' in result) {
    const label = (result as { isEven: boolean }).isEven ? 'even' : 'odd';
    return `${label}${confidenceSuffix(confidence)}`;
  }

  if (typeof result === 'string' && result === '') return confidenceSuffix(confidence).trim();

  const text = String(result);
  if (text.includes('\n')) return `${text}\n${confidenceSuffix(confidence).trim()}`;

  return `${text}${confidenceSuffix(confidence)}`;
}
