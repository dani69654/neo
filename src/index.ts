import * as readline from 'readline';
import { Neo, type Skill } from './core/Neo';
import { trainDouble, useDouble } from './skills/double/double';

const neo = new Neo();

function printHelp(): void {
  console.log(`
Commands:
  help              show this message
  train double      train the double skill
  use double <n>    run the double skill on a number
  knows <name>      check if Neo knows a skill
  exit              quit

A natural-language chat can be added here later.
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
      } else {
        console.log('Unknown skill. Try: train double');
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
      } else {
        console.log('Usage: use double <number>');
      }
      break;

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
