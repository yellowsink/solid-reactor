import {
  Expression,
  Super,
  Import,
  Statement,
  Identifier,
  ComputedPropName,
  Argument,
} from "@swc/core";

interface LeftSideReactor extends Identifier {
  value: "React" | "Reactor";
}

export type ReactHook = {
  return?: string | { get?: string; set?: string };
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

  if (n.type === "AssignmentExpression") {
    const hook = exprExtractReactHook(n.right);
    if (!hook) return;

    if (
      n.left.type === "ArrayPattern" &&
      n.left.elements.every((e): e is undefined | Identifier => e === null || e?.type === "Identifier")
    ) {
      hook.return = {
        get: n.left.elements[0]?.value,
        set: n.left.elements[1]?.value,
      };
    } else if (n.left.type === "Identifier") hook.return = n.left.value;
    else return;

    return hook;
  }
};

export const stmtExtractReactHooks = (n: Statement) => {
  if (n.type === "ExpressionStatement") {
    const hook = exprExtractReactHook(n.expression);
    return hook ? [hook] : undefined;
  }

  if (n.type === "VariableDeclaration") {
    const declarations = n.declarations
      .map((d) => {
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
          };
        return hook;
      })
      .filter((d): d is ReactHook => !!d);
    if (declarations.length !== 0) return declarations;
  }
};
