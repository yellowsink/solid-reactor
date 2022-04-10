import { Visitor } from "@swc/core/Visitor.js";
import { BlockStatement, JSXAttributeName, Statement } from "@swc/core";
import jsxTransform from "./jsxTransform.js";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor.js";
import emitHook from "./emitHook.js";
import callify from "./callify.js";

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

class Reactor extends Visitor {
  visitBlockStatement(block: BlockStatement): BlockStatement {
    const hookStmts = extractHookStmts(block.stmts);

    if (hookStmts.length === 0) return block;

    const getters = extractGetters(hookStmts);

    const refs = new Set<string>();

    processHooks(block.stmts, hookStmts, getters, refs);

    console.log(getters, refs);

    block = callify(block, getters);

    // don't break internal visitor routing
    block.stmts = this.visitStatements(block.stmts);

    return block;
  }

  visitJSXAttributeName(n: JSXAttributeName): JSXAttributeName {
    if (n.type === "Identifier" && n.value === "className") n.value = "class";
    return n;
  }
}

export default async (code: string) =>
  (
    await jsxTransform(code, {
      plugin: (m) => new Reactor().visitProgram(m),
      jsc: {
        parser: {
          syntax: "ecmascript",
          jsx: true,
        },
        target: "es2022",
      },
    })
  ).code;
