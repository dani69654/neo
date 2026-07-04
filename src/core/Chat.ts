/**
 * Orchestrates a single conversation turn: understands free text with the
 * `language` skill, then either replies with small talk (`chitchat`) or
 * runs an action skill Neo already knows (`double`, `isEven`).
 *
 * `Chat` is not itself a skill Neo learns — it is the conductor that
 * decides *when* to use the skills Neo knows. `Neo` stays generic and has
 * no notion of language, intents, or conversation at all.
 */

import type { Neo } from './Neo';
import { useLanguage } from '../skills/language/language';
import type { Intent } from '../skills/language/languageTestdata';
import type { ChitchatTopic } from '../skills/chitchat/chitchatTestdata';

/** Intents that trigger a numeric skill instead of a chitchat reply. */
const ACTION_INTENTS: ReadonlySet<Intent> = new Set(['double', 'isEven']);

function describeResult(intent: 'double' | 'isEven', result: unknown): string {
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

  /** Understands `text` and returns Neo's reply. */
  async handle(text: string): Promise<string> {
    const { intent, arg } = await useLanguage(text);

    if (!ACTION_INTENTS.has(intent)) {
      return this.reply(intent as ChitchatTopic);
    }

    if (arg === null) return this.reply('missingArg');
    if (!this.neo.knows(intent)) return this.reply('skillNotLearned');

    const result = await this.neo.use(intent, arg);
    return describeResult(intent as 'double' | 'isEven', result);
  }
}
