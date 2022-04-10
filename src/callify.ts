// let the games begin! - context aware (ish) recursive transform to make value accesses a call

import {
  ArrowFunctionExpression,
  BlockStatement,
  Expression,
  Fn,
  Identifier,
} from "@swc/core";
import AuxVisitor from "./AuxVisitor.js";
import { emitCallExpression } from "./emitters.js";

class Callifier extends AuxVisitor {
  callifyList;

  removeFromlist = false;

  constructor(callifyList: Set<string> | string[]) {
    super();
    this.callifyList =
      callifyList instanceof Set ? callifyList : new Set(callifyList);
  }

  visitIdentifier(n: Identifier): Identifier {
    if (this.removeFromlist) this.callifyList.delete(n.value);
    return n;
  }

  // visits all expressions but returns a bool to, when true, leave internal routing intact,
  // hence auxilliary visit expression.
  auxVisitExpression(n: Expression): [Expression, boolean] | undefined {
    if (n.type === "Identifier" && this.callifyList.has(n.value))
      // if we recurse straight back into this callexpression we will infini-loop
      return [emitCallExpression(n), false];
  }

  visitArrowFunctionExpression(e: ArrowFunctionExpression): Expression {
    // any param names will shadow existing values
    this.removeFromlist = true;
    e.params = this.visitPatterns(e.params);
    this.removeFromlist = false;

    e.body =
      e.body.type === "BlockStatement"
        ? this.visitBlockStatement(e.body)
        : this.visitExpression(e.body);

    return e;
  }

  visitFunction<T extends Fn>(n: T): T {
    // any param names will shadow existing values
    this.removeFromlist = true;
    n.params = this.visitParameters(n.params);
    this.removeFromlist = false;

    n.body = this.visitBlockStatement(n.body);

    return n;
  }
}

export default (node: BlockStatement, callifyList: Set<string> | string[]) => {
  const callifier = new Callifier(callifyList);

  return callifier.visitBlockStatement(node);
};
