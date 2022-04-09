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

class Reactor extends Visitor {
  visitExpression(n: Expression): Expression {
    if (n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression")
      return this.#visitFunctions(
        n,
        n.body.type === "BlockStatement"
          ? n.body
          : {
              type: "BlockStatement",
              span: { start: 0, end: 0, ctxt: 0 },
              stmts: [
                {
                  type: "ExpressionStatement",
                  span: { start: 0, end: 0, ctxt: 0 },
                  expression: n.body,
                },
              ],
            }
      );

    return n;
  }

  #visitFunctions(
    n: FunctionExpression | ArrowFunctionExpression,
    body: BlockStatement
  ): FunctionExpression | ArrowFunctionExpression {
    const hookStmts = body.stmts.map(stmtExtractReactHooks).filter((s): s is ReactHook[] => !!s).flat();

    if (hookStmts.length === 0) return n;

    console.log(hookStmts);

    return n;
  }
}

const transformed = await transform(
  `

export default () => {
  const [state, setState] = React.useState(0);
  Reactor.useEffect(() => {});
  let rerender;
  [, rerender] = useReducer(a => ~a, 0);

  return <div>balls</div>
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
