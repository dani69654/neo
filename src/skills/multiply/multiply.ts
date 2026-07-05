import { skillResult, type SkillResult } from '../../core/skillResult';

/** Multiplies two numbers. Rule-based — no training required. */

export const useMultiply = (a: number, b: number): SkillResult<number> => skillResult(a * b);
