import { Identifier, ArrowFunctionExpression, Expression, Fn } from "@swc/core";

import { AuxVisitor } from "emitkit";

export default class extends AuxVisitor {
  get targets() {
    return this.#targetStack[0];
  }
  #targetStack;
  // when this is true, any idents found will be removed from targets
  #removeIdents = false;

  constructor(targets: Set<string> | string[]) {
    super();
    this.#targetStack = targets instanceof Set ? [targets] : [new Set(targets)];
  }

  visitIdentifier(n: Identifier): Identifier {
    if (this.#removeIdents) this.targets.delete(n.value);
    return n;
  }

  visitArrowFunctionExpression(e: ArrowFunctionExpression): Expression {
    this.#removeIdents = true;
    this.#targetStack.unshift(new Set(this.#targetStack[0]));
    e.params = this.visitPatterns(e.params);
    this.#removeIdents = false;

    e.body =
      e.body.type === "BlockStatement"
        ? this.visitBlockStatement(e.body)
        : this.visitExpression(e.body);

    this.#targetStack.shift();

    return e;
  }

  visitFunction<T extends Fn>(n: T): T {
    this.#removeIdents = true;
    this.#targetStack.unshift(new Set(this.#targetStack[0]));
    n.params = this.visitParameters(n.params);
    this.#removeIdents = false;

    n.body = this.visitBlockStatement(n.body);

    this.#targetStack.shift();

    return n;
  }
}
