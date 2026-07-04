export type Skill = (...args: unknown[]) => unknown;

export class Neo {
  private skills = new Map<string, Skill>();

  learn(name: string, skill: Skill): void {
    // TODO: registrare la skill
    throw new Error('TODO: implementare learn');
  }

  use(name: string, ...args: unknown[]): unknown {
    // TODO: recuperare la skill e invocarla con args
    throw new Error('TODO: implementare use');
  }

  knows(name: string): boolean {
    // TODO: verificare se la skill è registrata
    throw new Error('TODO: implementare knows');
  }
}
