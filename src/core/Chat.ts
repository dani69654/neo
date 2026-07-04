/**
 * Orchestrates a single conversation turn: understands free text with the
 * `language` skill, then either replies with small talk (`chitchat`) or
 * runs an action skill Neo already knows.
 *
 * `Chat` is not itself a skill Neo learns — it is the conductor that
 * decides *when* to use the skills Neo knows. `Neo` stays generic and has
 * no notion of language, intents, or conversation at all.
 */

import type { Neo } from './Neo';
import { useLanguage } from '../skills/language/language';
import type { Intent } from '../skills/language/languageTestdata';
import type { ChitchatTopic } from '../skills/chitchat/chitchatTestdata';

/** Intents that need a number extracted from the user's text. */
const NUMERIC_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['double', 'isEven']);

/** Intents that run a skill immediately with no arguments. */
const IMMEDIATE_ACTION_INTENTS: ReadonlySet<Intent> = new Set(['clear', 'resources']);

function describeNumericResult(intent: 'double' | 'isEven', result: unknown): string {
  if (intent === 'double') {
    return `The double of that number is ${result}.`;
  }
  const { isEven, confidence } = result as { isEven: boolean; confidence: number };
  const label = isEven ? 'even' : 'odd';
  return `That number is ${label} (confidence: ${(confidence * 100).toFixed(1)}%).`;
}

export class Chat {
  constructor(private readonly neo: Neo) {}

  private async reply(topic: ChitchatTopic): Promise<string> {
    if (!this.neo.knows('chitchat')) {
      return 'I would reply, but I have not learned to chat yet. Run "learn chitchat" first.';
    }
    return (await this.neo.use('chitchat', topic)) as string;
  }

  /** Understands `text` and returns Neo's reply (empty string after a screen clear). */
  async handle(text: string): Promise<string> {
    const { intent, arg } = await useLanguage(text);

    if (IMMEDIATE_ACTION_INTENTS.has(intent)) {
      if (!this.neo.knows(intent)) return this.reply('skillNotLearned');
      return (await this.neo.use(intent)) as string;
    }

    if (NUMERIC_ACTION_INTENTS.has(intent)) {
      if (arg === null) return this.reply('missingArg');
      if (!this.neo.knows(intent)) return this.reply('skillNotLearned');
      const result = await this.neo.use(intent, arg);
      return describeNumericResult(intent as 'double' | 'isEven', result);
    }

    return this.reply(intent as ChitchatTopic);
  }
}
