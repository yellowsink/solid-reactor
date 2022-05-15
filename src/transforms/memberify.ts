// transform to make specific identifiers into prop accesses

import { BlockStatement, Expression } from "@swc/core";
import { emitIdentifier, emitMemberExpression } from "emitkit";
import ShadowingVisitor from "../ShadowingVisitor.js";

class Memberifier extends ShadowingVisitor {
  memberName;
  lookup;

  constructor(lookup: Map<string, string>, mem: string) {
    super(Array.from(lookup.keys()));
    this.lookup = lookup;
    this.memberName = emitIdentifier(mem);
  }

  auxVisitExpression(n: Expression): [Expression, boolean] | undefined {
    if (n.type === "Identifier" && this.targets.has(n.value))
      return [
        emitMemberExpression(
          this.memberName,
          emitIdentifier(this.lookup.get(n.value)!)
        ),
        false,
      ];
  }
}

export default (
  node: BlockStatement,
  lookup: Map<string, string>,
  base: string
) => new Memberifier(lookup, base).visitBlockStatement(node);
