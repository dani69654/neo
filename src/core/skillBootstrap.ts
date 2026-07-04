/**
 * Trains and registers skills on demand when Neo needs them but has not
 * learned them yet.
 */

import type { Neo, Skill } from './Neo';
import { registerBasicSkills } from './basicSkills';
import { trainDouble, useDouble } from '../skills/double/double';
import { trainIsEven, useIsEven } from '../skills/isEven/isEven';
import { DEFAULT_BITS } from '../skills/isEven/isEvenTestdata';
import { isLanguageTrained, trainLanguage } from '../skills/language/language';

const bootstraps = new Map<string, Promise<void>>();

function runOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const pending = bootstraps.get(key);
  if (pending) return pending;

  const promise = fn().finally(() => {
    bootstraps.delete(key);
  });
  bootstraps.set(key, promise);
  return promise;
}

export async function ensureLanguageReady(): Promise<void> {
  if (isLanguageTrained()) return;

  await runOnce('language', async () => {
    console.log('Training language...');
    await trainLanguage();
  });
}

export async function trainAndLearnDouble(neo: Neo): Promise<void> {
  await runOnce('double', async () => {
    console.log('Training double...');
    await trainDouble();
    neo.learn('double', useDouble as Skill);
  });
}

export async function trainAndLearnIsEven(neo: Neo, bits: number = DEFAULT_BITS): Promise<void> {
  await runOnce('isEven', async () => {
    console.log(`Training isEven with ${bits} bits (range 0–${2 ** bits - 1})...`);
    await trainIsEven(bits);
    neo.learn('isEven', useIsEven as Skill);
  });
}

/** Ensures a skill is ready to use, training it first when necessary. */
export async function ensureSkill(neo: Neo, name: string): Promise<void> {
  registerBasicSkills(neo);

  if (name === 'double') {
    if (!neo.knows('double')) await trainAndLearnDouble(neo);
    return;
  }

  if (name === 'isEven') {
    if (!neo.knows('isEven')) await trainAndLearnIsEven(neo);
    return;
  }

  if (!neo.knows(name)) {
    throw new Error(`Skill "${name}" is not available.`);
  }
}
