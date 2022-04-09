import type {
  AssignmentExpression,
  CallExpression,
  ExpressionStatement,
  Import,
  Super,
  ComputedPropName,
  Expression,
  Identifier,
  MemberExpression,
  Pattern,
  PrivateName,
  VariableDeclaration,
  ArrayExpression,
  ExprOrSpread,
  Statement,
  IfStatement,
  BlockStatement,
  StringLiteral,
  BinaryOperator,
  BinaryExpression,
  ArrowFunctionExpression,
  ConditionalExpression,
  NumericLiteral,
  OptionalChainingExpression,
  VariableDeclarator,
  UpdateOperator,
  UpdateExpression,
  Span,
} from "@swc/core";

export const blankSpan: Span = { start: 0, end: 0, ctxt: 0 };

export const emitIdentifier = (name: string): Identifier => ({
  span: blankSpan,
  type: "Identifier",
  value: name,
  optional: false,
});

export const emitMemberExpression = (
  object: Expression,
  property: Identifier | PrivateName | ComputedPropName
): MemberExpression => ({
  span: blankSpan,
  type: "MemberExpression",
  object,
  property,
});

export const emitVariableDeclaration = (
  kind: "const" | "let" | "var",
  ...declarations: VariableDeclarator[]
): VariableDeclaration => ({
  span: blankSpan,
  type: "VariableDeclaration",
  kind,
  declare: false,
  declarations,
});

export const emitVariableDeclarator = (
  id: Pattern,
  init?: Expression
): VariableDeclarator => ({
  span: blankSpan,
  type: "VariableDeclarator",
  definite: true,
  id,
  init,
});

export const emitCallExpression = (
  callee: Expression | Super | Import,
  ...args: (Expression | ExprOrSpread)[]
): CallExpression => ({
  span: blankSpan,
  type: "CallExpression",
  callee,
  arguments: args.map(
    (a): ExprOrSpread =>
      // @ts-expect-error
      a.type
        ? {
            expression: a,
          }
        : a
  ),
});

export const emitAssignmentExpression = (
  left: Expression,
  right: Expression
): AssignmentExpression => ({
  span: blankSpan,
  type: "AssignmentExpression",
  left,
  right,
  operator: "=",
});

export const emitExpressionStatement = (
  expression: Expression
): ExpressionStatement => ({
  span: blankSpan,
  type: "ExpressionStatement",
  expression,
});

export const emitArrayExpression = (
  ...elements: Expression[]
): ArrayExpression => ({
  type: "ArrayExpression",
  elements: elements.map((e): ExprOrSpread => ({ expression: e })),
  span: blankSpan,
});

export const emitBlockStatement = (...stmts: Statement[]): BlockStatement => ({
  span: blankSpan,
  type: "BlockStatement",
  stmts,
});

export const emitIfStatement = (
  test: Expression,
  statements: Statement | Statement[],
  alternate?: Statement | Statement[]
): IfStatement => ({
  span: blankSpan,
  type: "IfStatement",
  test,

  consequent: Array.isArray(statements)
    ? emitBlockStatement(...statements)
    : statements,

  alternate:
    alternate === undefined
      ? undefined
      : Array.isArray(alternate)
      ? emitBlockStatement(...alternate)
      : alternate,
});

export const emitStringLiteral = (str: string): StringLiteral => ({
  span: blankSpan,
  type: "StringLiteral",
  hasEscape: false,
  value: str,
});

export const emitBinaryExpression = (
  left: Expression,
  right: Expression,
  op: BinaryOperator
): BinaryExpression => ({
  span: blankSpan,
  type: "BinaryExpression",
  left,
  right,
  operator: op,
});

export const emitArrowFunctionExpression = (
  params: Pattern[],
  stmts: Statement[],
  async: boolean = false
): ArrowFunctionExpression => ({
  type: "ArrowFunctionExpression",
  generator: false,
  async,
  params,
  body: emitBlockStatement(...stmts),
  span: blankSpan,
});

export const emitComputedPropName = (
  expression: Expression
): ComputedPropName => ({
  span: blankSpan,
  type: "Computed",
  expression,
});

export const emitConditionalExpression = (
  test: Expression,
  consequent: Expression,
  alternate: Expression
): ConditionalExpression => ({
  span: blankSpan,
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
});

export const emitNumericLiteral = (value: number): NumericLiteral => ({
  span: blankSpan,
  type: "NumericLiteral",
  value,
});

export const emitOptionalChain = (
  object: Expression,
  property: Identifier | PrivateName | ComputedPropName
): OptionalChainingExpression => ({
  span: blankSpan,
  type: "OptionalChainingExpression",
  // @ts-expect-error - why isnt this in the type defs?
  questionDotToken: blankSpan,
  expr: emitMemberExpression(object, property),
});

export const emitUpdateExpression = (
  argument: Expression,
  operator: UpdateOperator,
  prefix: boolean = false
): UpdateExpression => ({
  span: blankSpan,
  type: "UpdateExpression",
  operator,
  prefix,
  argument,
});