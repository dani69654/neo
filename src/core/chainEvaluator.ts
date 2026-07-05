/**
 * Evaluates multi-step inline math (e.g. "2*9/3") using Neo's ML math skills.
 */

import type { Neo } from './Neo';
import { ensureSkill } from './skillBootstrap';
import { skillResult, unwrapConfidence, unwrapResult, type SkillResult } from './skillResult';
import { parseChainExpression, type ChainOp } from '../skills/language/mathParser';

const OP_TO_SKILL: Record<ChainOp, 'add' | 'subtract' | 'multiply' | 'divide'> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
};

async function applySkillOp(
  neo: Neo,
  a: number,
  op: ChainOp,
  b: number,
): Promise<SkillResult<number>> {
  const skill = OP_TO_SKILL[op];
  await ensureSkill(neo, skill);
  return (await neo.use(skill, a, b)) as SkillResult<number>;
}

async function evaluateTokensWithSkills(
  neo: Neo,
  tokens: Array<number | ChainOp>,
): Promise<SkillResult<number>> {
  const values: number[] = [tokens[0] as number];
  const ops: ChainOp[] = [];
  let confidence = 1;

  for (let i = 1; i < tokens.length; i += 2) {
    ops.push(tokens[i] as ChainOp);
    values.push(tokens[i + 1] as number);
  }

  let i = 0;
  while (i < ops.length) {
    if (ops[i] === '*' || ops[i] === '/') {
      const raw = await applySkillOp(neo, values[i], ops[i], values[i + 1]);
      values[i] = unwrapResult(raw);
      confidence = Math.min(confidence, unwrapConfidence(raw));
      values.splice(i + 1, 1);
      ops.splice(i, 1);
    } else {
      i++;
    }
  }

  let result = values[0];
  for (i = 0; i < ops.length; i++) {
    const raw = await applySkillOp(neo, result, ops[i], values[i + 1]);
    result = unwrapResult(raw);
    confidence = Math.min(confidence, unwrapConfidence(raw));
  }

  return skillResult(result, confidence);
}

/** Parses and evaluates a chain expression via add/subtract/multiply/divide skills. */
export async function evaluateChainWithSkills(neo: Neo, text: string): Promise<SkillResult<number>> {
  const parsed = parseChainExpression(text);
  if (!parsed) throw new Error('Invalid math expression.');
  return evaluateTokensWithSkills(neo, parsed.tokens);
}
