import { BlockStatement, JSXAttributeName, Statement } from "@swc/core";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor.js";
import emitHook from "./emitHook.js";
import { AuxVisitor, jsxTransform } from "emitkit";
import callify from "./transforms/callify.js";
import currentify from "./transforms/currentify.js";
import convertStyles from "./transforms/convertStyles.js";

const extractHookStmts = (stmts: Statement[]) =>
  stmts
    .map((s, i) => [i, stmtExtractReactHooks(s)])
    .filter((s): s is [number, ReactHook] => !!s[1]);

const extractGetters = (hookStmts: [unknown, ReactHook][]) =>
  new Set(
    hookStmts
      .map(
        ([, hook]) =>
          typeof hook.return?.target === "object" && hook.return.target.get
      )
      .filter((g): g is string => !!g)
  );

const processHooks = (
  stmts: Statement[],
  hookStmts: [number, ReactHook][],
  getters: Set<string>,
  refs: Set<string>
) => {
  for (const [hookIdx, hook] of hookStmts) {
    const maybeNewHook = emitHook(hook);
    if (!maybeNewHook) continue;
    const [newHook, newGetters, newRefs] = maybeNewHook;

    stmts.splice(hookIdx, 1, ...newHook);

    for (const g of newGetters) getters.add(g);
    for (const r of newRefs) refs.add(r);

    for (let i = hookIdx; i < hookStmts.length; i++)
      hookStmts[i][0] += newHook.length - 1;
  }
};

class Reactor extends AuxVisitor {
  auxVisitBlockStatement(
    block: BlockStatement
  ): [BlockStatement, boolean] | undefined {
    const hookStmts = extractHookStmts(block.stmts);

    if (hookStmts.length === 0) return;

    const getters = extractGetters(hookStmts);

    const refs = new Set<string>();

    processHooks(block.stmts, hookStmts, getters, refs);

    // call applicable getters (from createSignal etc)
    block = callify(block, getters);

    // add .current to applicable refs
    block = currentify(block, refs);

    // camelCase styles to skewer-case styles
    block = convertStyles(block);

    return [block, true];
  }

  visitJSXAttributeName(n: JSXAttributeName): JSXAttributeName {
    if (n.type === "Identifier")
      switch (n.value) {
        case "onChange":
          n.value = "onInput";
          break;

        case "className":
          n.value = "class";
          break;
      }

    return n;
  }
}

export default async (code: string) =>
  (
    await jsxTransform(code, {
      plugin: (m) => new Reactor().visitProgram(m),
    })
  ).code;
