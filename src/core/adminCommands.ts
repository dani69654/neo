/** Normalized admin verbs after synonym resolution. */
export type AdminVerb = 'help' | 'exit' | 'train' | 'use' | 'knows';

const VERB_SYNONYMS: Record<string, AdminVerb> = {
  help: 'help',
  '?': 'help',
  commands: 'help',
  exit: 'exit',
  quit: 'exit',
  q: 'exit',
  train: 'train',
  learn: 'train',
  teach: 'train',
  use: 'use',
  run: 'use',
  invoke: 'use',
  knows: 'knows',
  know: 'knows',
  has: 'knows',
};

/** Maps lowercase aliases to canonical skill names. */
const SKILL_SYNONYMS: Record<string, string> = {
  double: 'double',
  iseven: 'isEven',
  even: 'isEven',
  parity: 'isEven',
  language: 'language',
  lang: 'language',
  nlu: 'language',
  chitchat: 'chitchat',
  chat: 'chitchat',
};

export interface ParsedAdminCommand {
  verb: AdminVerb;
  args: string[];
}

/** Returns true if the first token looks like an admin command (including synonyms). */
export function isAdminCommand(line: string): boolean {
  const first = line.trim().split(/\s+/)[0]?.toLowerCase();
  return first !== undefined && first in VERB_SYNONYMS;
}

/** Parses a CLI line into a normalized verb and remaining args (skill aliases resolved). */
export function parseAdminCommand(line: string): ParsedAdminCommand | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const [rawVerb, ...rest] = trimmed.split(/\s+/);
  const verb = VERB_SYNONYMS[rawVerb.toLowerCase()];
  if (!verb) return null;

  const args = [...rest];
  if (args[0]) {
    const canonical = SKILL_SYNONYMS[args[0].toLowerCase()];
    if (canonical) args[0] = canonical;
  }

  return { verb, args };
}
