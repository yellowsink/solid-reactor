// transform function to be ran on the body of every function hit

import { BlockStatement, Statement } from "@swc/core";
import {
  emitArrayPattern,
  emitCallExpression,
  emitIdentifier,
  emitVariableDeclaration,
  emitVariableDeclarator,
} from "./emitters.js";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor.js";

export default (body: BlockStatement): BlockStatement | undefined => {
  const hookStmts = body.stmts
    .map((s, i) => [i, stmtExtractReactHooks(s)])
    .filter((s): s is [number, ReactHook] => !!s[1]);

  if (hookStmts.length === 0) return;

  console.log(hookStmts);

  for (const hookStmt of hookStmts) {
    const newHook = emitHook(hookStmt[1]);
    if (newHook) body.stmts[hookStmt[0]] = newHook;
  }

  return body;
};

function emitHook(hook: ReactHook): Statement | undefined {
  switch (hook.hookType) {
    case "useState":
      if (!hook.return) return;
      return emitVariableDeclaration(
        hook.return.declType,
        emitVariableDeclarator(
          emitArrayPattern(
            hook.return.get ? emitIdentifier(hook.return.get) : undefined,
            hook.return.set ? emitIdentifier(hook.return.set) : undefined
          ),
          emitCallExpression(emitIdentifier("createSignal"), ...hook.params)
        )
      );

    default:
      return;
  }
}
