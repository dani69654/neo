import * as readline from 'readline';
import { Neo, type Skill } from './core/Neo';
import { Chat } from './core/Chat';
import { isAdminCommand, parseAdminCommand } from './core/adminCommands';
import { trainDouble, useDouble } from './skills/double/double';
import { trainIsEven, useIsEven } from './skills/isEven/isEven';
import { DEFAULT_BITS } from './skills/isEven/isEvenTestdata';
import { trainLanguage } from './skills/language/language';
import { useChitchat } from './skills/chitchat/chitchat';

const neo = new Neo();
const chat = new Chat(neo);

function printHelp(): void {
  console.log(`
Admin commands (train, learn, and teach are interchangeable; same for use/run, knows/has):
  help                     show this message
  train double             train the double skill
  learn double             same as train double
  use double <n>           run the double skill on a number
  run isEven <n>           same as use isEven <n>
  train isEven [bits]      train the isEven skill (default: ${DEFAULT_BITS} bits, range 0–${2 ** DEFAULT_BITS - 1})
  train language           train the language skill (intent parsing)
  learn lang               same as train language
  learn chitchat           learn the chitchat skill (no training needed)
  train chat               same as learn chitchat
  knows <name>             check if Neo knows a skill
  has <name>               same as knows <name>
  exit                     quit

Anything else is treated as a free-form message to Neo, e.g.:
  hi
  double 21
  is 49 even
`);
}

async function handleAdminCommand(verb: string, rest: string[]): Promise<boolean> {
  switch (verb) {
    case 'help':
      printHelp();
      break;

    case 'exit':
      return false;

    case 'train':
      if (rest[0] === 'double') {
        console.log('Training double...');
        await trainDouble();
        neo.learn('double', useDouble as Skill);
        console.log('Skill "double" learned.');
      } else if (rest[0] === 'isEven') {
        const bits = rest[1] !== undefined ? Number(rest[1]) : DEFAULT_BITS;
        if (!Number.isInteger(bits) || bits < 1) {
          console.log('Please enter a valid number of bits (e.g. 8).');
          break;
        }
        console.log(`Training isEven with ${bits} bits (range 0–${2 ** bits - 1})...`);
        await trainIsEven(bits);
        neo.learn('isEven', useIsEven as Skill);
        console.log('Skill "isEven" learned.');
      } else if (rest[0] === 'language') {
        console.log('Training language...');
        await trainLanguage();
        console.log('Skill "language" learned.');
      } else if (rest[0] === 'chitchat') {
        neo.learn('chitchat', useChitchat as Skill);
        console.log('Skill "chitchat" learned.');
      } else {
        console.log(
          'Unknown skill. Try: train double | train isEven [bits] | train language | learn chitchat',
        );
      }
      break;

    case 'use':
      if (rest[0] === 'double' && rest[1] !== undefined) {
        const n = Number(rest[1]);
        if (Number.isNaN(n)) {
          console.log('Please enter a valid number.');
          break;
        }
        const result = await neo.use('double', n);
        console.log(result);
      } else if (rest[0] === 'isEven' && rest[1] !== undefined) {
        const n = Number(rest[1]);
        if (Number.isNaN(n)) {
          console.log('Please enter a valid number.');
          break;
        }
        try {
          const { isEven, confidence } = (await neo.use('isEven', n)) as {
            isEven: boolean;
            confidence: number;
          };
          const label = isEven ? 'even' : 'odd';
          console.log(`${label} (confidence: ${(confidence * 100).toFixed(1)}%)`);
        } catch (err) {
          console.log(err instanceof Error ? err.message : 'Prediction failed.');
        }
      } else {
        console.log('Usage: use double <number> | use isEven <number>');
      }
      break;

    case 'knows':
      if (rest[0]) {
        console.log(neo.knows(rest[0]) ? 'yes' : 'no');
      } else {
        console.log('Usage: knows <name>');
      }
      break;
  }

  return true;
}

async function handleLine(line: string): Promise<boolean> {
  const trimmed = line.trim();
  if (!trimmed) return true;

  if (isAdminCommand(trimmed)) {
    const parsed = parseAdminCommand(trimmed);
    if (parsed) return handleAdminCommand(parsed.verb, parsed.args);
  }

  try {
    console.log(await chat.handle(trimmed));
  } catch (err) {
    console.log(err instanceof Error ? err.message : 'Something went wrong.');
  }
  return true;
}

async function prompt(rl: readline.Interface): Promise<string> {
  return new Promise((resolve) => rl.question('neo> ', resolve));
}

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin as unknown as NodeJS.ReadableStream,
    output: process.stdout,
  });

  console.log('Neo — type "help" for admin commands, or just talk to me. Type "exit" to quit.');

  let running = true;
  while (running) {
    const line = await prompt(rl);
    running = await handleLine(line);
  }

  rl.close();
  console.log('Goodbye.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
