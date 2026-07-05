import type { Intent } from './languageTestdata';

type BinaryMathIntent = 'add' | 'subtract' | 'multiply' | 'divide';
export type ChainOp = '+' | '-' | '*' | '/';
type Op = ChainOp;

export interface MathParseResult {
  intent: BinaryMathIntent;
  numbers: [number, number];
}

export interface ChainEvalResult {
  /** Original expression trimmed for display. */
  display: string;
  result: number;
}

const NUMBER = '-?\\d+(?:\\.\\d+)?';

const OP_TO_INTENT: Record<string, BinaryMathIntent> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  x: 'multiply',
  '×': 'multiply',
  '/': 'divide',
  '÷': 'divide',
};

const INLINE_EXPR = /^[\d\s+\-*/x×÷.,]+$/;

/** Removes trailing sentence punctuation so "9+9?" still parses as math. */
function stripTrailingPunctuation(text: string): string {
  return text.trim().replace(/[?.!]+$/, '').trim();
}

function normalizeOp(char: string): Op | null {
  if (char === '+' ) return '+';
  if (char === '-') return '-';
  if (char === '*' || char === 'x' || char === '×') return '*';
  if (char === '/' || char === '÷') return '/';
  return null;
}

function applyOp(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) throw new Error('Cannot divide by zero.');
      return a / b;
  }
}

/** Tokenizes strings like "1 + 4 - 3" into alternating numbers and operators. */
function tokenizeInlineExpression(text: string): Array<number | Op> | null {
  const tokens: Array<number | Op> = [];
  let index = 0;

  while (index < text.length) {
    if (text[index] === ' ') {
      index++;
      continue;
    }

    const remaining = text.slice(index);
    const numberMatch = remaining.match(/^-?\d+(?:\.\d+)?/);
    if (numberMatch) {
      const lastIsNumber = tokens.length > 0 && typeof tokens[tokens.length - 1] === 'number';
      const matchedNegative = numberMatch[0].startsWith('-');

      if (lastIsNumber && !matchedNegative) return null;
      // After a number, "-3" is the minus operator followed by 3.
      if (lastIsNumber && matchedNegative) {
        // fall through to operator handling below
      } else if (
        matchedNegative &&
        tokens.length > 0 &&
        typeof tokens[tokens.length - 1] !== 'number'
      ) {
        // fall through to operator handling below
      } else {
        tokens.push(Number(numberMatch[0]));
        index += numberMatch[0].length;
        continue;
      }
    }

    const op = normalizeOp(text[index]);
    if (op) {
      if (tokens.length === 0 || typeof tokens[tokens.length - 1] !== 'number') return null;
      tokens.push(op);
      index++;
      continue;
    }

    return null;
  }

  if (tokens.length < 3 || tokens.length % 2 === 0) return null;
  if (typeof tokens[tokens.length - 1] !== 'number') return null;
  // Single binary ops (e.g. "2+1") use the matching skill instead.
  if (tokens.length === 3) return null;
  return tokens as Array<number | Op>;
}

/** Evaluates +/- after × and ÷ (standard precedence). */
function evaluateTokens(tokens: Array<number | Op>): number {
  const values: number[] = [tokens[0] as number];
  const ops: Op[] = [];

  for (let i = 1; i < tokens.length; i += 2) {
    ops.push(tokens[i] as Op);
    values.push(tokens[i + 1] as number);
  }

  let i = 0;
  while (i < ops.length) {
    if (ops[i] === '*' || ops[i] === '/') {
      values[i] = applyOp(values[i], ops[i], values[i + 1]);
      values.splice(i + 1, 1);
      ops.splice(i, 1);
    } else {
      i++;
    }
  }

  let result = values[0];
  for (i = 0; i < ops.length; i++) {
    result = applyOp(result, ops[i], values[i + 1]);
  }
  return result;
}

export interface ChainParseResult {
  display: string;
  tokens: Array<number | ChainOp>;
}

/**
 * Parses multi-operator inline expressions such as "1 + 4 - 3" or "2*9/3".
 * Single binary ops (e.g. "2+1") return null — those use a dedicated skill directly.
 */
export function parseChainExpression(text: string): ChainParseResult | null {
  const display = stripTrailingPunctuation(text);
  if (!display || !INLINE_EXPR.test(display)) return null;

  const tokens = tokenizeInlineExpression(display.replace(/\s+/g, ' ').trim());
  if (!tokens) return null;

  return { display, tokens };
}

/**
 * Evaluates inline arithmetic chains such as "1 + 4 - 3" or "2 * 3 + 4".
 * Returns null when the text contains words or is not a valid expression.
 */
export function evaluateChainExpression(text: string): ChainEvalResult | null {
  const parsed = parseChainExpression(text);
  if (!parsed) return null;

  return { display: parsed.display, result: evaluateTokens(parsed.tokens) };
}

/**
 * Detects phrased or single inline math before the ML classifier runs.
 * Multi-operator inline chains are handled by {@link evaluateChainExpression}.
 */
export function parseMathExpression(text: string): MathParseResult | null {
  const normalized = stripTrailingPunctuation(text).toLowerCase();

  let match = normalized.match(
    new RegExp(`subtract\\s+(${NUMBER})\\s+(?:from|to)\\s+(${NUMBER})`),
  );
  if (match) {
    return { intent: 'subtract', numbers: [Number(match[2]), Number(match[1])] };
  }

  match = normalized.match(
    new RegExp(`take\\s+(${NUMBER})\\s+away\\s+from\\s+(${NUMBER})`),
  );
  if (match) {
    return { intent: 'subtract', numbers: [Number(match[2]), Number(match[1])] };
  }

  match = normalized.match(new RegExp(`(${NUMBER})\\s+minus\\s+(${NUMBER})`));
  if (match) return { intent: 'subtract', numbers: [Number(match[1]), Number(match[2])] };

  match = normalized.match(new RegExp(`(${NUMBER})\\s+plus\\s+(${NUMBER})`));
  if (match) return { intent: 'add', numbers: [Number(match[1]), Number(match[2])] };

  match = normalized.match(new RegExp(`(${NUMBER})\\s+times\\s+(${NUMBER})`));
  if (match) return { intent: 'multiply', numbers: [Number(match[1]), Number(match[2])] };

  match = normalized.match(new RegExp(`(${NUMBER})\\s+(?:divided\\s+by|over)\\s+(${NUMBER})`));
  if (match) return { intent: 'divide', numbers: [Number(match[1]), Number(match[2])] };

  match = normalized.match(new RegExp(`divide\\s+(${NUMBER})\\s+by\\s+(${NUMBER})`));
  if (match) return { intent: 'divide', numbers: [Number(match[1]), Number(match[2])] };

  // Single inline operation only — chains are handled separately.
  match = normalized.match(new RegExp(`^(${NUMBER})\\s*([+\\-*/x×÷])\\s*(${NUMBER})$`));
  if (match) {
    const intent = OP_TO_INTENT[match[2]];
    if (intent) return { intent, numbers: [Number(match[1]), Number(match[3])] };
  }

  return null;
}

/** Returns true when the intent is one of the four primitive binary math skills. */
export function isBinaryMathIntent(intent: Intent): intent is BinaryMathIntent {
  return intent === 'add' || intent === 'subtract' || intent === 'multiply' || intent === 'divide';
}
