// emits a sensible set of code from a ReactHook

import {
  Argument,
  CallExpression,
  Identifier,
  Statement,
  VariableDeclarationKind,
} from "@swc/core";
import {
  emitArrayExpression,
  emitArrayPattern,
  emitArrowFunctionExpression,
  emitCallExpression,
  emitExpressionStatement,
  emitIdentifier,
  emitObjectExpression,
  emitParenthesisExpression,
  emitVariableDeclaration,
  emitVariableDeclarator,
} from "emitkit";
import { ReactHook } from "./hookExtractor.js";
import idGen from "./idGen.js";

interface ArrReturningReactHook extends ReactHook {
  return: {
    target: { get?: string; set?: string };
    declType: VariableDeclarationKind;
  };
}

interface StrReturningReactHook extends ReactHook {
  return: {
    target: string;
    declType: VariableDeclarationKind;
  };
}

const isArrReturningReactHook = (
  hook: ReactHook
): hook is ArrReturningReactHook => typeof hook.return?.target === "object";

const isStrReturningReactHook = (
  hook: ReactHook
): hook is StrReturningReactHook => typeof hook.return?.target === "string";

const emitCreateSignal = (hook: ArrReturningReactHook) =>
  emitVariableDeclaration(
    hook.return.declType,
    emitVariableDeclarator(
      emitArrayPattern(
        hook.return.target.get
          ? emitIdentifier(hook.return.target.get)
          : undefined,
        hook.return.target.set
          ? emitIdentifier(hook.return.target.set)
          : undefined
      ),
      emitCallExpression(emitIdentifier("createSignal"), ...hook.params)
    )
  );

const emitCreateReducer = (
  hook: ArrReturningReactHook
): [Statement[], string[]] => {
  const uniqueSetterId = idGen();

  hook.return.target.get ??= idGen();

  const stmts = [
    emitCreateSignal({
      hookType: "useState",
      params: [hook.params[1]],
      return: {
        declType: hook.return.declType,
        target: {
          get: hook.return.target.get,
          set: uniqueSetterId,
        },
      },
    }),
  ];

  if (hook.return.target.set)
    stmts.push(
      emitVariableDeclaration(
        "const",
        emitVariableDeclarator(
          emitIdentifier(hook.return.target.set),
          emitArrowFunctionExpression(
            [],
            emitCallExpression(
              emitIdentifier(uniqueSetterId),
              emitCallExpression(
                emitParenthesisExpression(hook.params[0].expression),
                emitIdentifier(hook.return.target.get)
              )
            )
          )
        )
      )
    );

  return [stmts, [hook.return.target.get]];
};

const emitCreateRef = (
  hook: StrReturningReactHook
): [Statement[], [], string[], []] => [
  [
    emitVariableDeclaration(
      hook.return.declType,
      emitVariableDeclarator(
        emitIdentifier(hook.return.target),
        hook.params[0]
          ? emitObjectExpression([
              emitIdentifier("current"),
              hook.params[0]?.expression,
            ])
          : emitObjectExpression()
      )
    ),
  ],
  [],
  [hook.return.target],
  [],
];

const emitCreateEffect = (
  params: Argument[],
  getters: string[]
): CallExpression => {
  if (
    params[1]?.expression.type === "ArrayExpression" &&
    params[1].expression.elements.every(
      (p): p is { expression: Identifier } =>
        p?.expression.type === "Identifier"
    )
  )
    getters = params[1].expression.elements.map((e) => e.expression.value);

  return emitCallExpression(
    emitIdentifier("createEffect"),
    emitCallExpression(
      emitIdentifier("on"),
      emitArrayExpression(...getters.map(emitIdentifier)),
      params[0].expression
    )
  );
};

export default (
  hook: ReactHook,
  getters: string[]
): [Statement[], string[], string[], string[]] | undefined => {
  switch (hook.hookType) {
    case "useState":
      return isArrReturningReactHook(hook)
        ? [[emitCreateSignal(hook)], [], [], ["createSignal"]]
        : undefined;

    case "useReducer":
      return isArrReturningReactHook(hook)
        ? [...emitCreateReducer(hook), [], ["createSignal"]]
        : undefined;

    case "useEffect":
      return hook.params.length > 0
        ? [
            [emitExpressionStatement(emitCreateEffect(hook.params, getters))],
            [],
            [],
            ["createEffect", "on"],
          ]
        : undefined;

    case "useRef":
      return isStrReturningReactHook(hook) ? emitCreateRef(hook) : undefined;

    default:
      return;
  }
};
