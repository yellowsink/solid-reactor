import { Visitor } from "@swc/core/Visitor.js";
import { BlockStatement, JSXAttributeName } from "@swc/core";
import jsxTransform from "./jsxTransform.js";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor.js";
import emitHook from "./emitHook.js";
import callify from "./callify.js";

class Reactor extends Visitor {
  visitBlockStatement(block: BlockStatement): BlockStatement {
    const hookStmts = block.stmts
      .map((s, i) => [i, stmtExtractReactHooks(s)])
      .filter((s): s is [number, ReactHook] => !!s[1]);

    if (hookStmts.length === 0) return block;

    const getters = hookStmts
      .map(([, hook]) => hook.return?.get)
      .filter((g): g is string => !!g);

    for (const hookStmt of hookStmts) {
      const newHook = emitHook(hookStmt[1]);
      if (newHook) block.stmts[hookStmt[0]] = newHook;
    }

    callify(block, getters);

    // don't break internal visitor routing
    block.stmts = block.stmts.map(s => this.visitStatement(s));

    return block;
  }

  visitJSXAttributeName(n: JSXAttributeName): JSXAttributeName {
    if (n.type === "Identifier" && n.value === "className") n.value = "class";
    return n;
  }
}

const transformed = await jsxTransform(
  `

export default () => {
  const [state, setState] = React.useState(0);
  Reactor.useEffect(() => console.log(state));
  let [, rerender] = useReducer(a => ~a, 0);

  return (
    <>
      <button onClick={() => setState(state * 2)}/>
      {state}
      <div>
        <span className={state}/>
      </div>
    </>
  );
}

`,
  {
    plugin: (m) => new Reactor().visitProgram(m),
    jsc: {
      parser: {
        syntax: "ecmascript",
        jsx: true,
      },
      target: "es2022",
    },
  }
);

console.log(transformed.code);
