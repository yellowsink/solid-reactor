// transform to make value accesses a call

import { BlockStatement, CallExpression, Expression } from "@swc/core";
import { emitCallExpression } from "emitkit";
import ShadowingVisitor from "../ShadowingVisitor.js";

class Callifier extends ShadowingVisitor {
  auxVisitExpression(n: Expression): [Expression, boolean] | undefined {
    // if we recurse straight back into this callexpression we will infini-loop
    if (n.type === "Identifier" && this.targets.has(n.value))
      return [emitCallExpression(n), false];
  }

  visitCallExpression(n: CallExpression): Expression {
    // dont callify params to on()! (for createEffect etc.)
    if (n.callee.type !== "Identifier" || n.callee.value !== "on")
      n.arguments = this.visitArguments(n.arguments);
    else if (n.arguments.length >= 2)
      n.arguments[1] = this.visitArgument(n.arguments[1]);

    return n;
  }
}

export default (node: BlockStatement, callifyList: Set<string> | string[]) =>
  new Callifier(callifyList).visitBlockStatement(node);
