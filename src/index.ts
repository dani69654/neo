import * as readline from 'readline';
import { Neo, type Skill } from './core/Neo';
import { Chat } from './core/Chat';
import { isAdminCommand, parseAdminCommand } from './core/adminCommands';
import { registerBasicSkills } from './core/basicSkills';
import {
  ensureSkill,
  trainAndLearnDouble,
  trainAndLearnIsEven,
} from './core/skillBootstrap';
import { trainLanguage } from './skills/language/language';
import { DEFAULT_BITS } from './skills/isEven/isEvenTestdata';
import { useClear } from './skills/clear/clear';
import { useResources } from './skills/resources/resources';
import { useChitchat } from './skills/chitchat/chitchat';

const neo = new Neo();
const chat = new Chat(neo);

const BINARY_MATH_SKILLS = new Set(['add', 'subtract', 'multiply', 'divide']);

function printHelp(): void {
  console.log(`
Admin commands (train, learn, and teach are interchangeable; same for use/run, knows/has):
  help                     show this message
  clear / cls / clean      clear the terminal (also: "clear screen" in chat)
  stats / memory / usage   show Neo process resource usage
  use add 5 3              add two numbers (also: subtract, multiply, divide)
  run sum 10 7             same as use add 10 7
  train double             train the double skill (ML)
  learn double             same as train double
  use double <n>           run the double skill on a number
  run isEven <n>           same as use isEven <n>
  train isEven [bits]      train the isEven skill (default: ${DEFAULT_BITS} bits, range 0–${2 ** DEFAULT_BITS - 1})
  train language           train the language skill (intent parsing)
  learn lang               same as train language
  learn chitchat           learn the chitchat skill (already loaded by default)
  train chat               same as learn chitchat
  knows <name>             check if Neo knows a skill
  has <name>               same as knows <name>
  exit                     quit

Basic skills (add, subtract, multiply, divide, clear, resources, chitchat) load at startup.

Anything else is treated as a free-form message to Neo, e.g.:
  hi
  add 5 and 3
  divide 20 by 4
  double 21
`);
}

async function handleAdminCommand(verb: string, rest: string[]): Promise<boolean> {
  switch (verb) {
    case 'help':
      printHelp();
      break;

    case 'exit':
      return false;

    case 'clear':
      if (neo.knows('clear')) {
        neo.use('clear');
      } else {
        console.log('Skill "clear" not available.');
      }
      break;

    case 'stats':
      if (neo.knows('resources')) {
        console.log(neo.use('resources'));
      } else {
        console.log('Skill "resources" not available.');
      }
      break;

    case 'train':
      if (rest[0] === 'double') {
        await trainAndLearnDouble(neo);
        console.log('Skill "double" learned.');
      } else if (rest[0] === 'isEven') {
        const bits = rest[1] !== undefined ? Number(rest[1]) : DEFAULT_BITS;
        if (!Number.isInteger(bits) || bits < 1) {
          console.log('Please enter a valid number of bits (e.g. 8).');
          break;
        }
        await trainAndLearnIsEven(neo, bits);
        console.log('Skill "isEven" learned.');
      } else if (rest[0] === 'language') {
        console.log('Training language...');
        await trainLanguage();
        console.log('Skill "language" learned.');
      } else if (rest[0] === 'chitchat') {
        neo.learn('chitchat', useChitchat as Skill);
        console.log('Skill "chitchat" learned.');
      } else if (rest[0] === 'clear') {
        neo.learn('clear', useClear as Skill);
        console.log('Skill "clear" learned.');
      } else if (rest[0] === 'resources') {
        neo.learn('resources', useResources as Skill);
        console.log('Skill "resources" learned.');
      } else {
        console.log(
          'Unknown skill. Try: train double | train isEven [bits] | train language | learn chitchat | learn clear | learn resources',
        );
      }
      break;

    case 'use':
      if (
        rest[0] &&
        BINARY_MATH_SKILLS.has(rest[0]) &&
        rest[1] !== undefined &&
        rest[2] !== undefined
      ) {
        const a = Number(rest[1]);
        const b = Number(rest[2]);
        if (Number.isNaN(a) || Number.isNaN(b)) {
          console.log('Please enter valid numbers.');
          break;
        }
        try {
          await ensureSkill(neo, rest[0]);
          console.log(await neo.use(rest[0], a, b));
        } catch (err) {
          console.log(err instanceof Error ? err.message : 'Calculation failed.');
        }
      } else if (rest[0] === 'double' && rest[1] !== undefined) {
        const n = Number(rest[1]);
        if (Number.isNaN(n)) {
          console.log('Please enter a valid number.');
          break;
        }
        try {
          await ensureSkill(neo, 'double');
          console.log(await neo.use('double', n));
        } catch (err) {
          console.log(err instanceof Error ? err.message : 'Prediction failed.');
        }
      } else if (rest[0] === 'isEven' && rest[1] !== undefined) {
        const n = Number(rest[1]);
        if (Number.isNaN(n)) {
          console.log('Please enter a valid number.');
          break;
        }
        try {
          await ensureSkill(neo, 'isEven');
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
        console.log(
          'Usage: use add <a> <b> | use subtract <a> <b> | use multiply <a> <b> | use divide <a> <b> | use double <n> | use isEven <n>',
        );
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
    const reply = await chat.handle(trimmed);
    if (reply) console.log(reply);
  } catch (err) {
    console.log(err instanceof Error ? err.message : 'Something went wrong.');
  }
  return true;
}

async function prompt(rl: readline.Interface): Promise<string> {
  return new Promise((resolve) => rl.question('neo> ', resolve));
}

async function main(): Promise<void> {
  registerBasicSkills(neo);

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
