// Parses React hooks out of an AST

import {
  Expression,
  Super,
  Import,
  Statement,
  Identifier,
  ComputedPropName,
  Argument,
  VariableDeclarationKind,
} from "@swc/core";

interface LeftSideReactor extends Identifier {
  value: "React" | "Reactor";
}

export type ReactHook = {
  return?: { get?: string; set?: string; declType: VariableDeclarationKind };
  hookType: string;
  params: Argument[];
};

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

const exprExtractReactHook = (n: Expression): undefined | ReactHook => {
  if (n.type === "CallExpression") {
    const hookType = identExtractReactHook(n.callee);
    if (!hookType) return;
    return {
      hookType,
      params: n.arguments,
    };
  }
};

export const stmtExtractReactHooks = (n: Statement) => {
  if (n.type === "ExpressionStatement")
    return exprExtractReactHook(n.expression);

  if (n.type === "VariableDeclaration") {
    const d = n.declarations[0];
    const hook = d.init && exprExtractReactHook(d.init);
    if (!hook) return;
    if (
      d.id.type === "ArrayPattern" &&
      d.id.elements.every(
        (e): e is undefined | Identifier =>
          e === null || e?.type === "Identifier"
      )
    )
      hook.return = {
        get: d.id.elements[0]?.value,
        set: d.id.elements[1]?.value,
        declType: n.kind,
      };

    return hook;
  }
};
