import { Visitor } from "@swc/core/Visitor.js";
import {
  ArrowFunctionExpression,
  BlockStatement,
  Expression,
  FunctionExpression,
  parseSync,
  transform,
} from "@swc/core";
import { ReactHook, stmtExtractReactHooks } from "./hookExtractor.js";
import jsxTransform from "./jsxTransform.js";
import { emitBlockStatement, emitExpressionStatement } from "./emitters.js";

class Reactor extends Visitor {
  visitExpression(n: Expression): Expression {
    if (
      n.type === "FunctionExpression" ||
      n.type === "ArrowFunctionExpression"
    ) {
      const newBody = this.#visitFunctionBodies(
        n.body.type === "BlockStatement"
          ? n.body
          : emitBlockStatement(emitExpressionStatement(n.body))
      );
      if (newBody) n.body = newBody;
    }

    return n;
  }

  #visitFunctionBodies(body: BlockStatement): BlockStatement | undefined {
    const hookStmts = body.stmts
      .map((s, i) => [i, stmtExtractReactHooks(s)])
      .filter((s): s is [number, ReactHook[]] => !!s[1])
      .flat();

    if (hookStmts.length === 0) return;

    console.log(hookStmts);

    return body;
  }
}

const transformed = await jsxTransform(
  `

export default () => {
  const [state, setState] = React.useState(0);
  Reactor.useEffect(() => {});
  let rerender;
  [, rerender] = useReducer(a => ~a, 0);

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
