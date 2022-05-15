import {
  ArrowFunctionExpression,
  Expression,
  Fn,
  JSXAttributeName,
  Param,
  Pattern,
  Program,
  Statement,
} from "@swc/core";
import {
  AuxVisitor,
  blankSpan,
  emitBlockStatement,
  emitIdentifier,
} from "emitkit";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor.js";
import emitHook from "./emitHook.js";
import callify from "./transforms/callify.js";
import currentify from "./transforms/currentify.js";
import convertStyles from "./transforms/convertStyles.js";
import memberify from "./transforms/memberify.js";

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
    const maybeNewHook = emitHook(hook, Array.from(getters.keys()));
    if (!maybeNewHook) continue;
    const [newHook, newGetters, newRefs] = maybeNewHook;

    stmts.splice(hookIdx, 1, ...newHook);

    for (const g of newGetters) getters.add(g);
    for (const r of newRefs) refs.add(r);

    for (let i = hookIdx; i < hookStmts.length; i++)
      hookStmts[i][0] += newHook.length - 1;
  }
};

const extractProps = (param: Pattern) => {
  if (param.type !== "ObjectPattern") return;
  const lookup = new Map<string, string>();

  for (const prop of param.properties) {
    if (
      prop.type === "KeyValuePatternProperty" &&
      prop.key.type === "Identifier" &&
      prop.value.type === "Identifier"
    )
      lookup.set(prop.key.value, prop.value.value);
    else if (prop.type === "AssignmentPatternProperty")
      lookup.set(prop.key.value, prop.key.value);
  }

  return lookup;
};

export class Reactor extends AuxVisitor {
  visitArrowFunctionExpression(e: ArrowFunctionExpression): Expression {
    const func = this.visitFunction({
      body:
        e.body.type === "BlockStatement"
          ? e.body
          : emitBlockStatement({
              type: "ReturnStatement",
              span: blankSpan,
              argument: e.body,
            }),
      async: e.async,
      generator: false,
      params: e.params.map(
        (p): Param => ({ type: "Parameter", pat: p, span: blankSpan })
      ),
      span: e.span,
    });

    e.body = func.body;
    e.params = func.params.map((p) => p.pat);
    return e;
  }

  visitFunction<T extends Fn>(n: T): T {
    const hookStmts = extractHookStmts(n.body.stmts);

    if (hookStmts.length === 0) return n;

    const getters = extractGetters(hookStmts);

    const refs = new Set<string>();

    const propReplaces = n.params[0] && extractProps(n.params[0].pat);

    processHooks(n.body.stmts, hookStmts, getters, refs);

    // call applicable getters (from createSignal etc)
    n.body = callify(n.body, getters);

    // add .current to applicable refs
    n.body = currentify(n.body, refs);

    // camelCase styles to skewer-case styles
    n.body = convertStyles(n.body);

    // re-structure props
    if (propReplaces) {
      n.params[0].pat = emitIdentifier("$$__REACTOR_PROPS");
      n.body = memberify(n.body, propReplaces, "$$__REACTOR_PROPS");
    }

    this.visitParameters(n.params);
    this.visitBlockStatement(n.body);

    return n;
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

export default (m: Program) => new Reactor().visitProgram(m);
