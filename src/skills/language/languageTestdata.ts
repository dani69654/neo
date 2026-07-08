/**
 * Training data and text-encoding utilities for the `language` skill.
 *
 * The goal is to classify a free-form English sentence into one of a small
 * set of intents. Some intents map to a skill Neo already knows (`double`,
 * `isEven`); the rest are conversational and are handled by the `chitchat`
 * skill instead.
 */

export type Intent =
  | 'double'
  | 'isEven'
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'mod'
  | 'clear'
  | 'resources'
  | 'recognizeFace'
  | 'greet'
  | 'goodbye'
  | 'thanks'
  | 'botChallenge'
  | 'help'
  | 'unknown'
  | 'tor';

/** Fixed order used everywhere an intent needs to become a number (e.g. one-hot encoding, softmax output index). */
export const INTENTS: Intent[] = [
  'double',
  'isEven',
  'add',
  'subtract',
  'multiply',
  'divide',
  'mod',
  'clear',
  'resources',
  'recognizeFace',
  'greet',
  'goodbye',
  'thanks',
  'botChallenge',
  'help',
  'unknown',
  'tor',
];

export interface LanguageExample {
  text: string;
  intent: Intent;
}

/**
 * Example training sentences, grouped by intent. What matters most is
 * *phrasing* diversity, not the specific numbers used: `tokenize` collapses
 * every number into a single `#` token, so "double 5" and "double 42"
 * produce the same bag-of-words vector. Some conversational examples are
 * adapted from common chatbot NLU datasets (e.g. Rasa's demo bots), which
 * use similar short greeting/small-talk phrases across the industry.
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

  // add
  { text: 'add 5 and 3', intent: 'add' },
  { text: '5 plus 3', intent: 'add' },
  { text: 'what is 5 plus 3', intent: 'add' },
  { text: 'sum of 10 and 7', intent: 'add' },
  { text: 'add 12 8', intent: 'add' },
  { text: 'please add 4 and 9', intent: 'add' },
  { text: 'what is 15 plus 6', intent: 'add' },
  { text: 'calculate 20 plus 30', intent: 'add' },
  { text: 'add together 6 and 11', intent: 'add' },
  { text: '100 plus 25', intent: 'add' },
  { text: 'can u add numbers', intent: 'add' },
  { text: 'can you add numbers', intent: 'add' },

  // subtract
  { text: '10 minus 3', intent: 'subtract' },
  { text: 'what is 10 minus 3', intent: 'subtract' },
  { text: 'subtract 10 3', intent: 'subtract' },
  { text: '20 minus 7', intent: 'subtract' },
  { text: '15 minus 4', intent: 'subtract' },
  { text: 'difference of 50 and 8', intent: 'subtract' },
  { text: '20 minus 6', intent: 'subtract' },
  { text: '100 minus 25', intent: 'subtract' },
  { text: 'what is 9 minus 4', intent: 'subtract' },
  { text: '50 minus 12', intent: 'subtract' },
  { text: 'can u subtract numbers', intent: 'subtract' },
  { text: 'can you subtract numbers', intent: 'subtract' },

  // multiply
  { text: 'multiply 6 by 7', intent: 'multiply' },
  { text: '6 times 7', intent: 'multiply' },
  { text: 'what is 6 times 7', intent: 'multiply' },
  { text: 'product of 5 and 8', intent: 'multiply' },
  { text: 'multiply 12 4', intent: 'multiply' },
  { text: '9 times 9', intent: 'multiply' },
  { text: 'please multiply 3 by 11', intent: 'multiply' },
  { text: 'what is 15 times 2', intent: 'multiply' },
  { text: 'calculate 8 times 6', intent: 'multiply' },
  { text: '100 times 3', intent: 'multiply' },

  // divide
  { text: 'divide 20 by 4', intent: 'divide' },
  { text: '20 divided by 4', intent: 'divide' },
  { text: 'what is 20 divided by 4', intent: 'divide' },
  { text: 'divide 100 5', intent: 'divide' },
  { text: '50 over 10', intent: 'divide' },
  { text: 'please divide 36 by 6', intent: 'divide' },
  { text: 'what is 81 divided by 9', intent: 'divide' },
  { text: 'quotient of 48 and 8', intent: 'divide' },
  { text: '12 divided by 3', intent: 'divide' },
  { text: '100 over 4', intent: 'divide' },

  // mod
  { text: '20 mod 3', intent: 'mod' },
  { text: '17 modulo 5', intent: 'mod' },
  { text: 'what is 20 mod 3', intent: 'mod' },
  { text: 'what is 17 modulo 5', intent: 'mod' },
  { text: 'remainder of 20 divided by 3', intent: 'mod' },
  { text: 'remainder of 17 divided by 5', intent: 'mod' },
  { text: 'mod 100 7', intent: 'mod' },
  { text: 'please calculate 99 mod 10', intent: 'mod' },
  { text: 'what is the remainder of 23 divided by 4', intent: 'mod' },
  { text: '10 mod 3', intent: 'mod' },
  { text: '10%3', intent: 'mod' },
  { text: 'what is 10%3', intent: 'mod' },
  { text: 'can you tell me the result of 10 mod 3', intent: 'mod' },
  { text: 'can you tell me the result of 10%3', intent: 'mod' },
  { text: 'result of 17%5', intent: 'mod' },

  // recognizeFace
  { text: 'who is in photo.png', intent: 'recognizeFace' },
  { text: 'who is /Users/me/photo.jpg', intent: 'recognizeFace' },
  { text: 'recognize face in test.jpg', intent: 'recognizeFace' },
  { text: 'identify face in faces/sample.png', intent: 'recognizeFace' },
  { text: 'who is in data/faces/person_01/01.png', intent: 'recognizeFace' },
  { text: 'identify data/faces/person_03/05.png', intent: 'recognizeFace' },
  { text: 'recognize data/faces/person_10/02.png', intent: 'recognizeFace' },

  // clear
  { text: 'clear', intent: 'clear' },
  { text: 'clear screen', intent: 'clear' },
  { text: 'clear terminal', intent: 'clear' },
  { text: 'clean screen', intent: 'clear' },
  { text: 'clean terminal', intent: 'clear' },
  { text: 'cls', intent: 'clear' },
  { text: 'wipe the screen', intent: 'clear' },
  { text: 'reset screen', intent: 'clear' },
  { text: 'empty the screen', intent: 'clear' },
  { text: 'please clear', intent: 'clear' },

  // resources
  { text: 'show memory usage', intent: 'resources' },
  { text: 'memory usage', intent: 'resources' },
  { text: 'how much memory are you using', intent: 'resources' },
  { text: 'resource usage', intent: 'resources' },
  { text: 'show resources', intent: 'resources' },
  { text: 'cpu usage', intent: 'resources' },
  { text: 'show stats', intent: 'resources' },
  { text: 'system stats', intent: 'resources' },
  { text: 'process memory', intent: 'resources' },
  { text: 'neo memory', intent: 'resources' },
  { text: 'your memory usage', intent: 'resources' },
  { text: 'how much cpu do you use', intent: 'resources' },

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

  // greet
  { text: 'hello', intent: 'greet' },
  { text: 'hi', intent: 'greet' },
  { text: 'hey', intent: 'greet' },
  { text: 'hi there', intent: 'greet' },
  { text: 'hey there', intent: 'greet' },
  { text: 'good morning', intent: 'greet' },
  { text: 'good evening', intent: 'greet' },
  { text: "what's up", intent: 'greet' },
  { text: 'nice to meet you', intent: 'greet' },
  { text: 'how are you', intent: 'greet' },
  { text: 'howdy', intent: 'greet' },

  // goodbye
  { text: 'bye', intent: 'goodbye' },
  { text: 'goodbye', intent: 'goodbye' },
  { text: 'see you later', intent: 'goodbye' },
  { text: 'good night', intent: 'goodbye' },
  { text: 'have a nice day', intent: 'goodbye' },
  { text: 'see you around', intent: 'goodbye' },
  { text: 'bye bye', intent: 'goodbye' },
  { text: 'talk to you later', intent: 'goodbye' },
  { text: 'i have to go', intent: 'goodbye' },
  { text: 'quit', intent: 'goodbye' },

  // thanks
  { text: 'thank you', intent: 'thanks' },
  { text: 'thanks', intent: 'thanks' },
  { text: 'thanks a lot', intent: 'thanks' },
  { text: 'much appreciated', intent: 'thanks' },
  { text: 'thank you so much', intent: 'thanks' },
  { text: 'appreciate it', intent: 'thanks' },
  { text: 'thanks for the help', intent: 'thanks' },
  { text: 'cheers', intent: 'thanks' },

  // botChallenge
  { text: 'who are you', intent: 'botChallenge' },
  { text: 'are you a bot', intent: 'botChallenge' },
  { text: 'are you a human', intent: 'botChallenge' },
  { text: 'am i talking to a bot', intent: 'botChallenge' },
  { text: 'am i talking to a human', intent: 'botChallenge' },
  { text: "what's your name", intent: 'botChallenge' },
  { text: 'are you real', intent: 'botChallenge' },
  { text: 'are you an ai', intent: 'botChallenge' },

  // tor
  { text: 'connect to tor', intent: 'tor' },
  { text: 'connect to the tor network', intent: 'tor' },
  { text: 'use tor', intent: 'tor' },
  { text: 'enable tor', intent: 'tor' },
  { text: 'go through tor', intent: 'tor' },
  { text: 'route my traffic through tor', intent: 'tor' },
  { text: 'anonymize my connection', intent: 'tor' },
  { text: 'make my connection anonymous', intent: 'tor' },
  { text: 'hide my ip', intent: 'tor' },
  { text: 'are you connected to tor', intent: 'tor' },
  { text: 'check tor connection', intent: 'tor' },
  { text: 'am i on tor', intent: 'tor' },
  { text: 'browse anonymously', intent: 'tor' },
  { text: 'use the onion network', intent: 'tor' },
  { text: 'turn on tor', intent: 'tor' },

  // unknown (genuinely unrelated small talk, no matching skill or topic)
  { text: "what's the weather like today", intent: 'unknown' },
  { text: 'tell me a joke', intent: 'unknown' },
  { text: 'i like pizza', intent: 'unknown' },
  { text: 'what time is it', intent: 'unknown' },
  { text: 'sing me a song', intent: 'unknown' },
  { text: 'what is the meaning of life', intent: 'unknown' },
  { text: 'tell me a story', intent: 'unknown' },
  { text: 'do you like music', intent: 'unknown' },
  { text: 'what is your favorite color', intent: 'unknown' },
  { text: 'can you drive a car', intent: 'unknown' },
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

/** Extracts all numbers found in the text, in order (e.g. "add 5 and 3" -> [5, 3]). */
export function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

/** Extracts the first number found in the text, if any (e.g. "double 21" -> 21). */
export function extractFirstNumber(text: string): number | null {
  const numbers = extractNumbers(text);
  return numbers.length > 0 ? numbers[0] : null;
}
