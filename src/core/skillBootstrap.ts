/**
 * Trains and registers skills on demand when Neo needs them but has not
 * learned them yet. Saves model weights to disk after training.
 */

import type { Neo, Skill } from './Neo';
import { getSkillState } from './neoState';
import { registerBasicSkills } from './basicSkills';
import {
  persistAddSkill,
  persistDivideSkill,
  persistDoubleSkill,
  persistIsEvenSkill,
  persistLanguageSkill,
  persistMultiplySkill,
  persistSubtractSkill,
} from './skillPersistence';
import { loadAddModel, trainAdd, useAdd } from '../skills/add/add';
import { loadSubtractModel, trainSubtract, useSubtract } from '../skills/subtract/subtract';
import { loadMultiplyModel, trainMultiply, useMultiply } from '../skills/multiply/multiply';
import { loadDivideModel, trainDivide, useDivide } from '../skills/divide/divide';
import { loadDoubleModel, trainDouble, useDouble } from '../skills/double/double';
import { loadIsEvenModel, trainIsEven, useIsEven } from '../skills/isEven/isEven';
import { DEFAULT_BITS } from '../skills/isEven/isEvenTestdata';
import { isLanguageTrained, loadLanguageModel, trainLanguage } from '../skills/language/language';

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

export { loadPersistedSkills } from './skillPersistence';

export async function ensureLanguageReady(): Promise<void> {
  if (isLanguageTrained()) return;
  if (getSkillState('language') && (await loadLanguageModel())) return;

  await runOnce('language', async () => {
    console.log('Training language...');
    await trainLanguage();
    await persistLanguageSkill();
  });
}

export async function trainAndLearnLanguage(): Promise<void> {
  await runOnce('language', async () => {
    console.log('Training language...');
    await trainLanguage();
    await persistLanguageSkill();
  });
}

export async function trainAndLearnAdd(neo: Neo): Promise<void> {
  await runOnce('add', async () => {
    if (getSkillState('add') && (await loadAddModel())) {
      neo.learn('add', useAdd as Skill);
      return;
    }
    console.log('Training add...');
    await trainAdd();
    neo.learn('add', useAdd as Skill);
    await persistAddSkill();
  });
}

export async function trainAndLearnSubtract(neo: Neo): Promise<void> {
  await runOnce('subtract', async () => {
    if (getSkillState('subtract') && (await loadSubtractModel())) {
      neo.learn('subtract', useSubtract as Skill);
      return;
    }
    console.log('Training subtract...');
    await trainSubtract();
    neo.learn('subtract', useSubtract as Skill);
    await persistSubtractSkill();
  });
}

export async function trainAndLearnMultiply(neo: Neo): Promise<void> {
  await runOnce('multiply', async () => {
    if (getSkillState('multiply') && (await loadMultiplyModel())) {
      neo.learn('multiply', useMultiply as Skill);
      return;
    }
    console.log('Training multiply...');
    await trainMultiply();
    neo.learn('multiply', useMultiply as Skill);
    await persistMultiplySkill();
  });
}

export async function trainAndLearnDivide(neo: Neo): Promise<void> {
  await runOnce('divide', async () => {
    if (getSkillState('divide') && (await loadDivideModel())) {
      neo.learn('divide', useDivide as Skill);
      return;
    }
    console.log('Training divide...');
    await trainDivide();
    neo.learn('divide', useDivide as Skill);
    await persistDivideSkill();
  });
}

export async function trainAndLearnDouble(neo: Neo): Promise<void> {
  await runOnce('double', async () => {
    if (getSkillState('double') && (await loadDoubleModel())) {
      neo.learn('double', useDouble as Skill);
      return;
    }
    console.log('Training double...');
    await trainDouble();
    neo.learn('double', useDouble as Skill);
    await persistDoubleSkill();
  });
}

export async function trainAndLearnIsEven(neo: Neo, bits: number = DEFAULT_BITS): Promise<void> {
  await runOnce('isEven', async () => {
    const saved = getSkillState('isEven');
    if (saved?.bits === bits && (await loadIsEvenModel())) {
      neo.learn('isEven', useIsEven as Skill);
      return;
    }
    console.log(`Training isEven with ${bits} bits (range 0–${2 ** bits - 1})...`);
    await trainIsEven(bits);
    neo.learn('isEven', useIsEven as Skill);
    await persistIsEvenSkill(bits);
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
