// let the games begin! - context aware (ish) recursive transform to make value accesses a call

import {
  ArrowFunctionExpression,
  BlockStatement,
  Expression,
  Fn,
  Identifier,
} from "@swc/core";
import { Visitor } from "@swc/core/Visitor.js";
import { emitCallExpression } from "./emitters.js";

class Callifier extends Visitor {
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
  auxVisitExpression(n: Expression): [Expression, boolean] {
    if (n.type === "Identifier" && this.callifyList.has(n.value))
      // if we recurse straight back into this callexpression we will infini-loop
      return [emitCallExpression(n), false];

    return [n, true];
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

// lord forgive me for this, but i need to keep the internal visitor routing intact
const oldExprVisitor = Callifier.prototype.visitExpression;

Callifier.prototype.visitExpression = function (n: Expression) {
  const [processed, keepRecursing] = this.auxVisitExpression(n);

  return keepRecursing ? oldExprVisitor.call(this, processed) : processed;
};

export default (node: BlockStatement, callifyList: Set<string> | string[]) => {
  const callifier = new Callifier(callifyList);

  return callifier.visitBlockStatement(node);
};
