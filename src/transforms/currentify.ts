// transform to make ref={} calls access the .current prop

import { BlockStatement, JSXAttribute, JSXAttributeOrSpread } from "@swc/core";
import { AuxVisitor, emitIdentifier, emitMemberExpression } from "emitkit";

class Currentifier extends AuxVisitor {
  refList;

  constructor(refList: string[] | Set<string>) {
    super();
    this.refList = refList instanceof Set ? refList : new Set(refList);
  }

  auxVisitJSXAttribute(
    n: JSXAttribute
  ): [JSXAttributeOrSpread, boolean] | undefined {
    if (
      n.name.type !== "Identifier" ||
      n.name.value !== "ref" ||
      n.value?.type !== "JSXExpressionContainer" ||
      n.value.expression.type !== "Identifier" ||
      !this.refList.has(n.value.expression.value)
    )
      return;

    n.value.expression = emitMemberExpression(
      n.value.expression,
      emitIdentifier("current")
    );

    return [n, true];
  }
}

export default (node: BlockStatement, refList: string[] | Set<string>) =>
  new Currentifier(refList).visitBlockStatement(node);
