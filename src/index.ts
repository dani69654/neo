import { Neo } from './core/Neo';
import { trainDouble, useDouble } from './skills/double/double';
import { pariDispari } from './skills/pariDispari';

const neo = new Neo();

async function main() {
  // console.log("Training double...");
  // await trainDouble();
  
  // console.log(await useDouble(21));

  neo.learn('double', trainDouble);
  console.log(neo.use('double', 21));
}

main();
