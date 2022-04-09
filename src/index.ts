import { Visitor } from "@swc/core/Visitor.js";
import {
  ArrowFunctionExpression,
  Declaration,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  JSXAttribute,
  JSXAttributeName,
  JSXAttributeOrSpread,
  JSXElement,
  JSXFragment,
  JSXOpeningElement,
} from "@swc/core";
import jsxTransform from "./jsxTransform.js";
import {
  emitBlockStatement,
  emitExpressionStatement,
  emitIdentifier,
} from "./emitters.js";
import visitFunctionBodies from "./visitFunctionBodies.js";

class Reactor extends Visitor {
  visitFunctionExpression(n: FunctionExpression): FunctionExpression {
    const newBody = visitFunctionBodies(n.body);
    if (newBody) n.body = newBody;

    // don't break the visitor
    this.visitBlockStatement(n.body);
    return n;
  }

  visitFunctionDeclaration(decl: FunctionDeclaration): Declaration {
    const newBody = visitFunctionBodies(decl.body);
    if (newBody) decl.body = newBody;

    // don't break the visitor
    this.visitBlockStatement(decl.body);
    return decl;
  }

  visitArrowFunctionExpression(e: ArrowFunctionExpression): Expression {
    const newBody = visitFunctionBodies(
      e.body.type === "BlockStatement"
        ? e.body
        : emitBlockStatement(emitExpressionStatement(e.body))
    );
    if (newBody) e.body = newBody;

    // don't break the visitor
    if (e.body.type === "BlockStatement") this.visitBlockStatement(e.body);
    else this.visitExpression(e.body);
    return e;
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
