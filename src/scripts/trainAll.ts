import { trainAllPersistedSkills } from '../core/skillPersistence';
import { Neo } from '../core/Neo';
import { DEFAULT_BITS } from '../skills/isEven/isEvenTestdata';

async function main(): Promise<void> {
  const neo = new Neo();
  const bitsArg = process.argv[2];
  const bits = bitsArg !== undefined ? Number(bitsArg) : DEFAULT_BITS;

  if (!Number.isInteger(bits) || bits < 1) {
    console.error('Usage: npm run train-all [isEvenBits]');
    process.exit(1);
  }

  console.log('Neo train-all — training and saving all ML skills...');
  await trainAllPersistedSkills(neo, bits);
  console.log('Done. Weights saved under data/models/ and state in data/neo-state.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
