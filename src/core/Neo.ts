export type Skill = (...args: unknown[]) => unknown;

export class Neo {
  private skills = new Map<string, Skill>();

  learn(name: string, skill: Skill): void {
    this.skills.set(name, skill);
  }

  use(name: string, ...args: unknown[]): unknown {
    const skill = this.skills.get(name);
    if (!skill) throw new Error(`Skill ${name} not found`);
    return skill(...args);
  }

  knows(name: string): boolean {
    return this.skills.has(name);
  }
}
