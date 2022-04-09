import {
  Expression,
  Super,
  Import,
  Statement,
  Identifier,
  ComputedPropName,
} from "@swc/core";

interface LeftSideReactor extends Identifier {
  value: "React" | "Reactor";
}

const isValidLeftSide = (n: Expression): n is LeftSideReactor =>
  n.type === "Identifier" && (n.value === "React" || n.value === "Reactor");

const isValidIdentifier = (
  n: Expression | Super | Import | ComputedPropName
): n is Identifier => n.type === "Identifier" && n.value.startsWith("use");

const identExtractReactHook = (
  n: Expression | Super | Import
): string | undefined =>
  isValidIdentifier(n)
    ? n.value
    : n.type === "MemberExpression" &&
      isValidLeftSide(n.object) &&
      isValidIdentifier(n.property)
    ? n.property.value
    : undefined;

const isExprReactHook = (n: Expression): boolean =>
  (n.type === "CallExpression" && identExtractReactHook(n.callee) != undefined) ||
  (n.type === "AssignmentExpression" && isExprReactHook(n.right));

export const isStmtReactHook = (n: Statement) =>
  (n.type === "ExpressionStatement" && isExprReactHook(n.expression)) ||
  (n.type === "VariableDeclaration" &&
    n.declarations.some((d) => d.init && isExprReactHook(d.init)));