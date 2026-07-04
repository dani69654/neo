/**
 * Response templates for the `chitchat` skill.
 *
 * Unlike `double` or `isEven`, chitchat has no numeric pattern to learn
 * from data, so there is nothing to train with TensorFlow: it is a plain
 * lookup table from topic to a handful of hand-written replies. A random
 * reply is picked each time so Neo doesn't sound too repetitive.
 */

/**
 * Topics the `chitchat` skill can reply to. Most match a conversational
 * `Intent` from the `language` skill one-to-one (`greet`, `goodbye`, ...);
 * `missingArg` and `skillNotLearned` are extra topics used by the `Chat`
 * orchestrator when an action intent (`double`, `isEven`) can't be carried
 * out yet.
 */
export type ChitchatTopic =
  | 'greet'
  | 'goodbye'
  | 'thanks'
  | 'botChallenge'
  | 'help'
  | 'unknown'
  | 'missingArg'
  | 'skillNotLearned';

export const CHITCHAT_RESPONSES: Record<ChitchatTopic, string[]> = {
  greet: [
    'Hello! I can double numbers or check if they are even.',
    'Hi there! What can I do for you?',
    'Hey! Ask me to double a number, or whether it is even or odd.',
  ],
  goodbye: ['Goodbye!', 'See you later!', 'Bye! Come back anytime.'],
  thanks: ["You're welcome!", 'Anytime!', 'No problem at all!'],
  botChallenge: [
    "I'm Neo, an AI that learns new skills over time.",
    'Yes, I am an AI — I learn skills one at a time, like in The Matrix.',
  ],
  help: [
    'I can add, subtract, multiply, and divide numbers, double a value, check even/odd, clear the screen, and show resource usage. Try "add 5 and 3" or "divide 20 by 4".',
  ],
  unknown: [
    "I didn't understand that.",
    "Sorry, I'm not sure what you mean.",
    'Can you rephrase that?',
  ],
  missingArg: [
    "Sure, but I need the numbers — try 'double 21', 'add 5 and 3', or 'divide 20 by 4'.",
  ],
  skillNotLearned: [
    "I understand what you want, but I haven't learned that skill yet.",
  ],
};

/** Picks a random reply for the given topic. */
export function pickResponse(topic: ChitchatTopic): string {
  const options = CHITCHAT_RESPONSES[topic];
  return options[Math.floor(Math.random() * options.length)];
}
