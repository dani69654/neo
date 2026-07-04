/** Divides the first number by the second. Rule-based — no training required. */

export const useDivide = (a: number, b: number): number => {
  if (b === 0) throw new Error('Cannot divide by zero.');
  return a / b;
};
