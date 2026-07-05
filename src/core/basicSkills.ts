/**
 * Skills Neo knows from the start — no training step required.
 */

import type { Neo, Skill } from './Neo';
import { useMultiply } from '../skills/multiply/multiply';
import { useDivide } from '../skills/divide/divide';
import { useClear } from '../skills/clear/clear';
import { useResources } from '../skills/resources/resources';
import { useChitchat } from '../skills/chitchat/chitchat';

const BASIC_SKILLS: ReadonlyArray<[string, Skill]> = [
  ['multiply', useMultiply as Skill],
  ['divide', useDivide as Skill],
  ['clear', useClear as Skill],
  ['resources', useResources as Skill],
  ['chitchat', useChitchat as Skill],
];

export function registerBasicSkills(neo: Neo): void {
  for (const [name, skill] of BASIC_SKILLS) {
    if (!neo.knows(name)) neo.learn(name, skill);
  }
}
