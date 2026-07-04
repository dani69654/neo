import * as readline from 'readline';
import { Neo, type Skill } from './core/Neo';
import { trainDouble, useDouble } from './skills/double/double';
import { trainIsEven, useIsEven } from './skills/isEven/isEven';
import { DEFAULT_BITS } from './skills/isEven/isEvenTestdata';
import { trainLanguage, useLanguage } from './skills/language/language';

const neo = new Neo();

function printHelp(): void {
  console.log(`
Commands:
  help                     show this message
  train double             train the double skill
  use double <n>           run the double skill on a number
  train isEven [bits]      train the isEven skill (default: ${DEFAULT_BITS} bits, range 0–${2 ** DEFAULT_BITS - 1})
  use isEven <n>           run the isEven skill on a number
  train language           train the language skill (intent parsing)
  say <free text>          parse free text and run the matching skill
  knows <name>             check if Neo knows a skill
  exit                     quit
`);
}

async function handleCommand(line: string): Promise<boolean> {
  const [command, ...rest] = line.trim().split(/\s+/);
  if (!command) return true;

  switch (command) {
    case 'help':
      printHelp();
      break;

    case 'exit':
    case 'quit':
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
      } else {
        console.log('Unknown skill. Try: train double | train isEven [bits] | train language');
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

    case 'say': {
      const text = rest.join(' ');
      if (!text) {
        console.log('Usage: say <free text>, e.g. say double 21');
        break;
      }
      try {
        const { intent, arg, confidence } = await useLanguage(text);
        console.log(`Intent: ${intent} (confidence: ${(confidence * 100).toFixed(1)}%)`);

        if (intent === 'double' || intent === 'isEven') {
          if (arg === null) {
            console.log(`I understood "${intent}", but couldn't find a number in your sentence.`);
          } else if (!neo.knows(intent)) {
            console.log(`Skill "${intent}" isn't learned yet. Run "train ${intent}" first.`);
          } else {
            console.log(await neo.use(intent, arg));
          }
        }
      } catch (err) {
        console.log(err instanceof Error ? err.message : 'Language skill failed.');
      }
      break;
    }

    case 'knows':
      if (rest[0]) {
        console.log(neo.knows(rest[0]) ? 'yes' : 'no');
      } else {
        console.log('Usage: knows <name>');
      }
      break;

    default:
      console.log(`Unknown command: "${command}". Type "help".`);
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

  console.log('Neo — type "help" for commands, "exit" to quit.');

  let running = true;
  while (running) {
    const line = await prompt(rl);
    running = await handleCommand(line);
  }

  rl.close();
  console.log('Goodbye.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
