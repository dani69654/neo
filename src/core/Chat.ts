/**
 * Orchestrates a single conversation turn: understands free text with the
 * `language` skill, then either replies with small talk (`chitchat`) or
 * runs an action skill Neo already knows.
 */

import type { Neo } from './Neo';
import { confidenceSuffix, formatSkillResult, unwrapConfidence, unwrapResult } from './skillResult';
import { evaluateChainWithSkills } from './chainEvaluator';
import { ensureLanguageReady, ensureSkill } from './skillBootstrap';
import { useLanguage } from '../skills/language/language';
import type { Intent } from '../skills/language/languageTestdata';
import type { ChitchatTopic } from '../skills/chitchat/chitchatTestdata';
import type { RecognizeFaceValue } from '../skills/recognizeFace/recognizeFace';

const UNARY_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['double', 'isEven']);
const BINARY_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['add', 'subtract', 'multiply', 'divide', 'mod']);
const IMMEDIATE_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['clear', 'resources', 'tor']);
const FACE_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['recognizeFace']);

function describeActionResult(intent: Intent, raw: unknown, numbers: number[]): string {
  const result = unwrapResult(raw);
  const suffix = confidenceSuffix(unwrapConfidence(raw));

  switch (intent) {
    case 'double':
      return `The double of ${numbers[0]} is ${result}${suffix}.`;
    case 'isEven': {
      const { isEven } = result as { isEven: boolean };
      const label = isEven ? 'even' : 'odd';
      return `${numbers[0]} is ${label}${suffix}.`;
    }
    case 'add':
      return `${numbers[0]} + ${numbers[1]} = ${result}${suffix}.`;
    case 'subtract':
      return `${numbers[0]} - ${numbers[1]} = ${result}${suffix}.`;
    case 'multiply':
      return `${numbers[0]} × ${numbers[1]} = ${result}${suffix}.`;
    case 'divide':
      return `${numbers[0]} ÷ ${numbers[1]} = ${result}${suffix}.`;
    case 'mod':
      return `${numbers[0]} mod ${numbers[1]} = ${result}${suffix}.`;
    default:
      return formatSkillResult(raw);
  }
}

export class Chat {
  constructor(private readonly neo: Neo) {}

  private async reply(topic: ChitchatTopic): Promise<string> {
    await ensureSkill(this.neo, 'chitchat');
    return formatSkillResult(await this.neo.use('chitchat', topic));
  }

  /** Understands `text` and returns Neo's reply (empty string after a screen clear). */
  async handle(text: string): Promise<string> {
    await ensureLanguageReady();
    const { intent, numbers, chainEval, imagePath } = await useLanguage(text);

    if (chainEval) {
      try {
        const raw = await evaluateChainWithSkills(this.neo, text);
        return `${chainEval.display} = ${unwrapResult(raw)}${confidenceSuffix(unwrapConfidence(raw))}.`;
      } catch (err) {
        return err instanceof Error ? err.message : 'Calculation failed.';
      }
    }

    if (IMMEDIATE_ACTION_INTENTS.has(intent)) {
      await ensureSkill(this.neo, intent);
      const raw = await this.neo.use(intent);
      const text = formatSkillResult(raw);
      return unwrapResult(raw) === '' ? '' : text;
    }

    if (FACE_ACTION_INTENTS.has(intent)) {
      if (!imagePath) return this.reply('missingArg');
      await ensureSkill(this.neo, 'recognizeFace');
      try {
        const raw = await this.neo.use('recognizeFace', imagePath);
        const { name, unknown, uncertain } = unwrapResult(raw) as RecognizeFaceValue;
        const suffix = confidenceSuffix(unwrapConfidence(raw));
        if (unknown) {
          return (
            `I don't recognize this face — it doesn't match anyone I was trained on${suffix}. ` +
            'Add photos under data/faces/<name>/ and run "train recognizeFace".'
          );
        }
        if (uncertain) {
          return `I'm not sure — maybe ${name}${suffix}.`;
        }
        return `That's ${name}${suffix}.`;
      } catch (err) {
        return err instanceof Error ? err.message : 'Face recognition failed.';
      }
    }

    if (BINARY_ACTION_INTENTS.has(intent)) {
      if (numbers.length < 2) return this.reply('missingArg');
      await ensureSkill(this.neo, intent);
      try {
        const raw = await this.neo.use(intent, numbers[0], numbers[1]);
        return describeActionResult(intent, raw, numbers);
      } catch (err) {
        return err instanceof Error ? err.message : 'Calculation failed.';
      }
    }

    if (UNARY_ACTION_INTENTS.has(intent)) {
      if (numbers.length < 1) return this.reply('missingArg');
      await ensureSkill(this.neo, intent);
      try {
        const raw = await this.neo.use(intent, numbers[0]);
        return describeActionResult(intent, raw, numbers);
      } catch (err) {
        return err instanceof Error ? err.message : 'Calculation failed.';
      }
    }

    return this.reply(intent as ChitchatTopic);
  }
}
