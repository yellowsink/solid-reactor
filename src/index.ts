import { Visitor } from "@swc/core/Visitor.js";
import { Expression } from "@swc/core";
import jsxTransform from "./jsxTransform.js";
import { emitBlockStatement, emitExpressionStatement } from "./emitters.js";
import visitFunctionBodies from "./visitFunctionBodies.js";

class Reactor extends Visitor {
  visitExpression(n: Expression): Expression {
    if (
      n.type === "FunctionExpression" ||
      n.type === "ArrowFunctionExpression"
    ) {
      const newBody = visitFunctionBodies(
        n.body.type === "BlockStatement"
          ? n.body
          : emitBlockStatement(emitExpressionStatement(n.body))
      );
      if (newBody) n.body = newBody;
    }

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
