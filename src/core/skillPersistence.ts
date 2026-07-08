/**
 * Loads and saves trained ML skills to disk.
 */

import type { Neo, Skill } from './Neo';
import { getSkillState, markSkillTrained } from './neoState';
import { registerBasicSkills } from './basicSkills';
import { loadAddModel, saveAddModel, trainAdd, useAdd } from '../skills/add/add';
import { loadSubtractModel, saveSubtractModel, trainSubtract, useSubtract } from '../skills/subtract/subtract';
import { loadMultiplyModel, saveMultiplyModel, trainMultiply, useMultiply } from '../skills/multiply/multiply';
import { loadDivideModel, saveDivideModel, trainDivide, useDivide } from '../skills/divide/divide';
import { loadModModel, saveModModel, trainMod, useMod } from '../skills/mod/mod';
import { loadSlmModel, saveSlmModel, trainSlm, useSlm } from '../skills/slm/slm';
import {
  loadRecognizeFaceModel,
  saveRecognizeFaceModel,
  trainRecognizeFace,
  useRecognizeFace,
} from '../skills/recognizeFace/recognizeFace';
import { loadDoubleModel, saveDoubleModel, trainDouble, useDouble } from '../skills/double/double';
import { loadIsEvenModel, saveIsEvenModel, trainIsEven, useIsEven } from '../skills/isEven/isEven';
import { DEFAULT_BITS } from '../skills/isEven/isEvenTestdata';
import {
  isLanguageTrained,
  loadLanguageModel,
  saveLanguageModel,
  trainLanguage,
} from '../skills/language/language';

export async function persistLanguageSkill(): Promise<void> {
  await saveLanguageModel();
  markSkillTrained('language');
}

export async function persistAddSkill(): Promise<void> {
  await saveAddModel();
  markSkillTrained('add');
}

export async function persistSubtractSkill(): Promise<void> {
  await saveSubtractModel();
  markSkillTrained('subtract');
}

export async function persistMultiplySkill(): Promise<void> {
  await saveMultiplyModel();
  markSkillTrained('multiply');
}

export async function persistDivideSkill(): Promise<void> {
  await saveDivideModel();
  markSkillTrained('divide');
}

export async function persistModSkill(): Promise<void> {
  await saveModModel();
  markSkillTrained('mod');
}

export async function persistSlmSkill(): Promise<void> {
  await saveSlmModel();
  markSkillTrained('slm');
}

export async function persistRecognizeFaceSkill(): Promise<void> {
  await saveRecognizeFaceModel();
  markSkillTrained('recognizeFace');
}

export async function persistDoubleSkill(): Promise<void> {
  await saveDoubleModel();
  markSkillTrained('double');
}

export async function persistIsEvenSkill(bits: number): Promise<void> {
  await saveIsEvenModel();
  markSkillTrained('isEven', { bits });
}

/** Restores all persisted skills from disk into a running Neo instance. */
export async function loadPersistedSkills(neo: Neo): Promise<string[]> {
  registerBasicSkills(neo);
  const restored: string[] = [];

  if (getSkillState('language') && (await loadLanguageModel())) {
    restored.push('language');
  }

  if (getSkillState('add') && (await loadAddModel())) {
    neo.learn('add', useAdd as Skill);
    restored.push('add');
  }

  if (getSkillState('subtract') && (await loadSubtractModel())) {
    neo.learn('subtract', useSubtract as Skill);
    restored.push('subtract');
  }

  if (getSkillState('multiply') && (await loadMultiplyModel())) {
    neo.learn('multiply', useMultiply as Skill);
    restored.push('multiply');
  }

  if (getSkillState('divide') && (await loadDivideModel())) {
    neo.learn('divide', useDivide as Skill);
    restored.push('divide');
  }

  if (getSkillState('mod') && (await loadModModel())) {
    neo.learn('mod', useMod as Skill);
    restored.push('mod');
  }

  if (getSkillState('slm') && (await loadSlmModel())) {
    neo.learn('slm', useSlm as Skill);
    restored.push('slm');
  }

  if (getSkillState('recognizeFace') && (await loadRecognizeFaceModel())) {
    neo.learn('recognizeFace', useRecognizeFace as Skill);
    restored.push('recognizeFace');
  }

  if (getSkillState('double') && (await loadDoubleModel())) {
    neo.learn('double', useDouble as Skill);
    restored.push('double');
  }

  const isEvenState = getSkillState('isEven');
  if (isEvenState && (await loadIsEvenModel())) {
    neo.learn('isEven', useIsEven as Skill);
    restored.push('isEven');
  }

  return restored;
}

/** Trains and saves all ML skills (for `npm run train-all`). */
export async function trainAllPersistedSkills(neo: Neo, isEvenBits: number = DEFAULT_BITS): Promise<void> {
  registerBasicSkills(neo);

  console.log('Training language...');
  await trainLanguage();
  await persistLanguageSkill();

  console.log('Training add...');
  await trainAdd();
  neo.learn('add', useAdd as Skill);
  await persistAddSkill();

  console.log('Training subtract...');
  await trainSubtract();
  neo.learn('subtract', useSubtract as Skill);
  await persistSubtractSkill();

  console.log('Training multiply...');
  await trainMultiply();
  neo.learn('multiply', useMultiply as Skill);
  await persistMultiplySkill();

  console.log('Training divide...');
  await trainDivide();
  neo.learn('divide', useDivide as Skill);
  await persistDivideSkill();

  console.log('Training mod...');
  await trainMod();
  neo.learn('mod', useMod as Skill);
  await persistModSkill();

  console.log('Training slm...');
  await trainSlm();
  neo.learn('slm', useSlm as Skill);
  await persistSlmSkill();

  console.log('Training recognizeFace...');
  await trainRecognizeFace();
  neo.learn('recognizeFace', useRecognizeFace as Skill);
  await persistRecognizeFaceSkill();

  console.log('Training double...');
  await trainDouble();
  neo.learn('double', useDouble as Skill);
  await persistDoubleSkill();

  console.log(`Training isEven (${isEvenBits} bits)...`);
  await trainIsEven(isEvenBits);
  neo.learn('isEven', useIsEven as Skill);
  await persistIsEvenSkill(isEvenBits);
}
