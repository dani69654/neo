/**
 * Trains and registers skills on demand when Neo needs them but has not
 * learned them yet.
 */

import type { Neo, Skill } from './Neo';
import { registerBasicSkills } from './basicSkills';
import { trainAdd, useAdd } from '../skills/add/add';
import { trainSubtract, useSubtract } from '../skills/subtract/subtract';
import { trainMultiply, useMultiply } from '../skills/multiply/multiply';
import { trainDivide, useDivide } from '../skills/divide/divide';
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

export async function trainAndLearnAdd(neo: Neo): Promise<void> {
  await runOnce('add', async () => {
    console.log('Training add...');
    await trainAdd();
    neo.learn('add', useAdd as Skill);
  });
}

export async function trainAndLearnSubtract(neo: Neo): Promise<void> {
  await runOnce('subtract', async () => {
    console.log('Training subtract...');
    await trainSubtract();
    neo.learn('subtract', useSubtract as Skill);
  });
}

export async function trainAndLearnMultiply(neo: Neo): Promise<void> {
  await runOnce('multiply', async () => {
    console.log('Training multiply...');
    await trainMultiply();
    neo.learn('multiply', useMultiply as Skill);
  });
}

export async function trainAndLearnDivide(neo: Neo): Promise<void> {
  await runOnce('divide', async () => {
    console.log('Training divide...');
    await trainDivide();
    neo.learn('divide', useDivide as Skill);
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

  if (name === 'add') {
    if (!neo.knows('add')) await trainAndLearnAdd(neo);
    return;
  }

  if (name === 'subtract') {
    if (!neo.knows('subtract')) await trainAndLearnSubtract(neo);
    return;
  }

  if (name === 'multiply') {
    if (!neo.knows('multiply')) await trainAndLearnMultiply(neo);
    return;
  }

  if (name === 'divide') {
    if (!neo.knows('divide')) await trainAndLearnDivide(neo);
    return;
  }

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
