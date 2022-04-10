// emits a sensible set of code from a ReactHook

import { Statement, VariableDeclarationKind } from "@swc/core";
import {
  emitArrayPattern,
  emitArrowFunctionExpression,
  emitBlockStatement,
  emitCallExpression,
  emitExpressionStatement,
  emitIdentifier,
  emitParenthesisExpression,
  emitVariableDeclaration,
  emitVariableDeclarator,
} from "./emitters.js";
import { ReactHook } from "./hookExtractor.js";
import idGen from "./idGen.js";

interface ReturningReactHook extends ReactHook {
  return: {
    get?: string;
    set?: string;
    declType: VariableDeclarationKind;
  };
}

const isReturningReactHook = (hook: ReactHook): hook is ReturningReactHook =>
  hook.return?.declType !== undefined;

const emitCreateSignal = (hook: ReturningReactHook) =>
  emitVariableDeclaration(
    hook.return.declType,
    emitVariableDeclarator(
      emitArrayPattern(
        hook.return.get ? emitIdentifier(hook.return.get) : undefined,
        hook.return.set ? emitIdentifier(hook.return.set) : undefined
      ),
      emitCallExpression(emitIdentifier("createSignal"), ...hook.params)
    )
  );

const emitCreateReducer = (
  hook: ReturningReactHook
): [Statement[], string[]] => {
  const uniqueSetterId = idGen();

  if (hook.return.get === undefined) hook.return.get = idGen();

  const stmts = [
    emitCreateSignal({
      hookType: "useState",
      params: [hook.params[1]],
      return: {
        declType: hook.return.declType,
        get: hook.return.get,
        set: uniqueSetterId,
      },
    }),
  ];

  if (hook.return.set)
    stmts.push(
      emitVariableDeclaration(
        "const",
        emitVariableDeclarator(
          emitIdentifier(hook.return.set),
          emitArrowFunctionExpression(
            [],
            emitCallExpression(
              emitIdentifier(uniqueSetterId),
              emitCallExpression(
                emitParenthesisExpression(hook.params[0].expression),
                emitIdentifier(hook.return.get)
              )
            )
          )
        )
      )
    );

  return [stmts, [hook.return.get]];
};

export default (hook: ReactHook): [Statement[], string[]] | undefined => {
  switch (hook.hookType) {
    case "useState":
      return isReturningReactHook(hook)
        ? [[emitCreateSignal(hook)], []]
        : undefined;

    case "useReducer":
      return isReturningReactHook(hook) ? emitCreateReducer(hook) : undefined;

    case "useEffect":
      return [
        [
          emitExpressionStatement(
            emitCallExpression(emitIdentifier("createEffect"), hook.params[0])
          ),
        ],
        [],
      ];

    default:
      return;
  }
};
