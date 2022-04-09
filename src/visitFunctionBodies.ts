// transform function to be ran on the body of every function hit

import { BlockStatement } from "@swc/core";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor";

export default (body: BlockStatement): BlockStatement | undefined => {
  const hookStmts = body.stmts
    .map((s, i) => [i, stmtExtractReactHooks(s)])
    .filter((s): s is [number, ReactHook[]] => !!s[1])
    .flat();

  if (hookStmts.length === 0) return;

  console.log(hookStmts);

  return body;
};
