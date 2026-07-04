/**
 * Training data and text-encoding utilities for the `language` skill.
 *
 * The goal is to classify a free-form English sentence into one of a small
 * set of intents, each mapping to a skill Neo already knows (or to a
 * fallback like "help"/"unknown").
 */

export type Intent = 'double' | 'isEven' | 'help' | 'unknown';

/** Fixed order used everywhere an intent needs to become a number (e.g. one-hot encoding, softmax output index). */
export const INTENTS: Intent[] = ['double', 'isEven', 'help', 'unknown'];

export interface LanguageExample {
  text: string;
  intent: Intent;
}

/**
 * Example training sentences, grouped by intent. What matters most is
 * *phrasing* diversity, not the specific numbers used: `tokenize` collapses
 * every number into a single `#` token, so "double 5" and "double 42"
 * produce the same bag-of-words vector. A handful of "unknown" examples
 * are adapted from common chatbot NLU datasets (e.g. Rasa's demo bots),
 * which use similar short greeting/small-talk phrases across the industry.
 */
export const LANGUAGE_TRAINING_DATA: LanguageExample[] = [
  // double
  { text: 'double 21', intent: 'double' },
  { text: 'double the number 5', intent: 'double' },
  { text: 'what is double of 10', intent: 'double' },
  { text: 'can you double 42', intent: 'double' },
  { text: 'multiply 8 by two', intent: 'double' },
  { text: 'give me the double of 3', intent: 'double' },
  { text: 'twice 7', intent: 'double' },
  { text: "what's 12 doubled", intent: 'double' },
  { text: 'double 9 for me', intent: 'double' },
  { text: '15 doubled is what', intent: 'double' },
  { text: 'please double 6', intent: 'double' },
  { text: 'compute the double of 11', intent: 'double' },
  { text: 'what is 2 times 14', intent: 'double' },
  { text: 'double this number 20', intent: 'double' },
  { text: 'i want the double of 30', intent: 'double' },
  { text: 'double 100', intent: 'double' },
  { text: 'multiply by two 4', intent: 'double' },
  { text: 'can you multiply 17 by 2', intent: 'double' },
  { text: 'double it 25', intent: 'double' },
  { text: 'what do you get if you double 13', intent: 'double' },

  // isEven
  { text: 'is 7 even', intent: 'isEven' },
  { text: 'is 42 even or odd', intent: 'isEven' },
  { text: 'check if 100 is even', intent: 'isEven' },
  { text: 'tell me if 9 is odd', intent: 'isEven' },
  { text: 'is 15 an odd number', intent: 'isEven' },
  { text: 'even or odd 256', intent: 'isEven' },
  { text: 'what is the parity of 8', intent: 'isEven' },
  { text: 'is 3 divisible by two', intent: 'isEven' },
  { text: 'is 50 an even number', intent: 'isEven' },
  { text: 'can you tell if 11 is even', intent: 'isEven' },
  { text: 'odd or even 99', intent: 'isEven' },
  { text: 'is 0 even', intent: 'isEven' },
  { text: 'check the parity of 21', intent: 'isEven' },
  { text: 'is 1000 odd', intent: 'isEven' },
  { text: 'tell me whether 6 is even or odd', intent: 'isEven' },
  { text: 'is 45 even', intent: 'isEven' },
  { text: 'please check if 12 is odd', intent: 'isEven' },
  { text: 'what is 19 even or odd', intent: 'isEven' },
  { text: 'is 64 an even number', intent: 'isEven' },
  { text: 'determine if 77 is odd', intent: 'isEven' },

  // help
  { text: 'help', intent: 'help' },
  { text: 'what can you do', intent: 'help' },
  { text: 'show me the commands', intent: 'help' },
  { text: 'what do you know', intent: 'help' },
  { text: 'list your skills', intent: 'help' },
  { text: 'what are your skills', intent: 'help' },
  { text: 'how do i use you', intent: 'help' },
  { text: 'what commands do you support', intent: 'help' },
  { text: 'show help', intent: 'help' },
  { text: 'i need help', intent: 'help' },
  { text: 'what should i type', intent: 'help' },
  { text: 'give me the list of commands', intent: 'help' },
  { text: 'how does this work', intent: 'help' },
  { text: 'what options do i have', intent: 'help' },
  { text: 'show your abilities', intent: 'help' },

  // unknown (greetings / small talk, not mapped to any skill)
  { text: 'hello', intent: 'unknown' },
  { text: 'hi', intent: 'unknown' },
  { text: 'hey', intent: 'unknown' },
  { text: 'hi there', intent: 'unknown' },
  { text: 'good morning', intent: 'unknown' },
  { text: 'good evening', intent: 'unknown' },
  { text: 'hey there', intent: 'unknown' },
  { text: 'thank you', intent: 'unknown' },
  { text: 'thanks', intent: 'unknown' },
  { text: 'good night', intent: 'unknown' },
  { text: 'bye', intent: 'unknown' },
  { text: 'goodbye', intent: 'unknown' },
  { text: 'see you later', intent: 'unknown' },
  { text: 'have a nice day', intent: 'unknown' },
  { text: 'who are you', intent: 'unknown' },
  { text: 'are you a bot', intent: 'unknown' },
  { text: 'are you a human', intent: 'unknown' },
  { text: "what's your name", intent: 'unknown' },
  { text: 'nice to meet you', intent: 'unknown' },
  { text: 'how are you', intent: 'unknown' },
];

/**
 * Splits text into lowercase word tokens, stripping punctuation and
 * collapsing every number into a single `#` placeholder token. This lets
 * the model learn "double #" as a pattern instead of memorizing specific
 * numbers, which never generalizes to numbers it hasn't seen.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => (/^\d+$/.test(token) ? '#' : token));
}

/** Builds a sorted, de-duplicated vocabulary from a set of examples. */
export function buildVocabulary(examples: LanguageExample[] = LANGUAGE_TRAINING_DATA): string[] {
  const words = new Set<string>();
  for (const { text } of examples) {
    for (const token of tokenize(text)) words.add(token);
  }
  return Array.from(words).sort();
}

/**
 * Encodes text as a bag-of-words vector: one entry per vocabulary word,
 * 1 if the word is present in the text, 0 otherwise. The vector's length
 * and word order must match the vocabulary used at training time.
 */
export function textToVector(text: string, vocabulary: string[]): number[] {
  const tokens = new Set(tokenize(text));
  return vocabulary.map((word) => (tokens.has(word) ? 1 : 0));
}

/** One-hot encodes an intent using the fixed order in `INTENTS`. */
export function intentToVector(intent: Intent): number[] {
  return INTENTS.map((candidate) => (candidate === intent ? 1 : 0));
}

/** Extracts the first number found in the text, if any (e.g. "double 21" -> 21). */
export function extractFirstNumber(text: string): number | null {
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}
