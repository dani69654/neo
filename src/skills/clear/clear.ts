/**
 * Clears the terminal screen, like the Unix `clear` command.
 * Rule-based — no training required.
 */

/** ANSI reset sequence; works in most terminals including Node readline. */
const CLEAR_SCREEN = '\x1Bc';

export const useClear = (): string => {
  process.stdout.write(CLEAR_SCREEN);
  return '';
};
