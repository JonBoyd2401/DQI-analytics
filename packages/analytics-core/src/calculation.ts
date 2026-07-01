export type Expression =
  | { type: 'literal'; value: number }
  | { type: 'reference'; name: string }
  | { type: 'binary'; operator: 'add' | 'subtract' | 'multiply' | 'divide'; left: Expression; right: Expression };

export function evaluate(expression: Expression, values: Readonly<Record<string, number>>, depth = 0): number | null {
  if (depth > 32) throw new Error('Expression complexity limit exceeded');
  if (expression.type === 'literal') return expression.value;
  if (expression.type === 'reference') {
    const value = values[expression.name];
    if (value === undefined) throw new Error(`Unknown calculation reference: ${expression.name}`);
    return value;
  }
  const left = evaluate(expression.left, values, depth + 1);
  const right = evaluate(expression.right, values, depth + 1);
  if (left === null || right === null) return null;
  switch (expression.operator) {
    case 'add': return left + right;
    case 'subtract': return left - right;
    case 'multiply': return left * right;
    case 'divide': return right === 0 ? null : left / right;
  }
}

export function explain(expression: Expression): string {
  if (expression.type === 'literal') return String(expression.value);
  if (expression.type === 'reference') return `[${expression.name}]`;
  const operators = { add: '+', subtract: '-', multiply: '×', divide: '÷' };
  return `(${explain(expression.left)} ${operators[expression.operator]} ${explain(expression.right)})`;
}
