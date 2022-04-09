// transform function to be ran on the body of every function hit

import { BlockStatement, Statement } from "@swc/core";
import callify from "./callify.js";
import emitHook from "./emitHook.js";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor.js";

export default (body: BlockStatement): BlockStatement | undefined => {
  const hookStmts = body.stmts
    .map((s, i) => [i, stmtExtractReactHooks(s)])
    .filter((s): s is [number, ReactHook] => !!s[1]);

  if (hookStmts.length === 0) return;

  const getters = hookStmts
    .map(([, hook]) => hook.return?.get)
    .filter((g): g is string => !!g);

  for (const hookStmt of hookStmts) {
    const newHook = emitHook(hookStmt[1]);
    if (newHook) body.stmts[hookStmt[0]] = newHook;
  }

  callify(body, getters);

  return body;
};
