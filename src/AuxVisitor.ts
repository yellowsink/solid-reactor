// Like Visitor.ts, but with a load of aux functions that you can call instead
// without breaking the internal routing of the visitor.

import { Visitor } from "@swc/core/Visitor.js";

export default class AuxVisitor extends Visitor {}

// excuse this hackiness, but here we are
for (const func of Reflect.ownKeys(Visitor.prototype)) {
  if (
    typeof func === "symbol" ||
    !func.startsWith("visit") ||
    // @ts-expect-error
    typeof Visitor.prototype[func] !== "function"
  )
    continue;

  const newName = "auxV" + func.slice(1);

  // @ts-expect-error
  AuxVisitor.prototype[newName] = (n) => [n, true];

  // @ts-expect-error
  const origFunc = AuxVisitor.prototype[func];

  // @ts-expect-error
  AuxVisitor.prototype[func] = function (n) {
    // @ts-expect-error
    const maybeProcessed = this[newName](n);

    // @ts-expect-error
    if (!maybeProcessed) return Visitor.prototype[func].call(this, n);

    const [processed, keepRecursing] = maybeProcessed;

    return keepRecursing ? origFunc.call(this, processed) : processed;
  };
}
