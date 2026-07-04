/**
 * Orchestrates a single conversation turn: understands free text with the
 * `language` skill, then either replies with small talk (`chitchat`) or
 * runs an action skill Neo already knows.
 */

import type { Neo } from './Neo';
import { ensureLanguageReady, ensureSkill } from './skillBootstrap';
import { useLanguage } from '../skills/language/language';
import type { Intent } from '../skills/language/languageTestdata';
import type { ChitchatTopic } from '../skills/chitchat/chitchatTestdata';

const UNARY_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['double', 'isEven']);
const BINARY_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['add', 'subtract', 'multiply', 'divide']);
const IMMEDIATE_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['clear', 'resources']);

function describeActionResult(intent: Intent, result: unknown, numbers: number[]): string {
  switch (intent) {
    case 'double':
      return `The double of ${numbers[0]} is ${result}.`;
    case 'isEven': {
      const { isEven, confidence } = result as { isEven: boolean; confidence: number };
      const label = isEven ? 'even' : 'odd';
      return `${numbers[0]} is ${label} (confidence: ${(confidence * 100).toFixed(1)}%).`;
    }
    case 'add':
      return `${numbers[0]} + ${numbers[1]} = ${result}.`;
    case 'subtract':
      return `${numbers[0]} - ${numbers[1]} = ${result}.`;
    case 'multiply':
      return `${numbers[0]} × ${numbers[1]} = ${result}.`;
    case 'divide':
      return `${numbers[0]} ÷ ${numbers[1]} = ${result}.`;
    default:
      return String(result);
  }
}

export class Chat {
  constructor(private readonly neo: Neo) {}

  private async reply(topic: ChitchatTopic): Promise<string> {
    await ensureSkill(this.neo, 'chitchat');
    return (await this.neo.use('chitchat', topic)) as string;
  }

  /** Understands `text` and returns Neo's reply (empty string after a screen clear). */
  async handle(text: string): Promise<string> {
    await ensureLanguageReady();
    const { intent, numbers, chainEval } = await useLanguage(text);

    if (chainEval) {
      return `${chainEval.display} = ${chainEval.result}.`;
    }

    if (IMMEDIATE_ACTION_INTENTS.has(intent)) {
      await ensureSkill(this.neo, intent);
      return (await this.neo.use(intent)) as string;
    }

    if (BINARY_ACTION_INTENTS.has(intent)) {
      if (numbers.length < 2) return this.reply('missingArg');
      await ensureSkill(this.neo, intent);
      try {
        const result = await this.neo.use(intent, numbers[0], numbers[1]);
        return describeActionResult(intent, result, numbers);
      } catch (err) {
        return err instanceof Error ? err.message : 'Calculation failed.';
      }
    }

    if (UNARY_ACTION_INTENTS.has(intent)) {
      if (numbers.length < 1) return this.reply('missingArg');
      await ensureSkill(this.neo, intent);
      try {
        const result = await this.neo.use(intent, numbers[0]);
        return describeActionResult(intent, result, numbers);
      } catch (err) {
        return err instanceof Error ? err.message : 'Calculation failed.';
      }
    }

    return this.reply(intent as ChitchatTopic);
  }
}
