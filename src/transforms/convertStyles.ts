// fixes style={{}} objects

import { BlockStatement, JSXAttribute, JSXAttributeOrSpread } from "@swc/core";
import { AuxVisitor, emitIdentifier, emitStringLiteral } from "emitkit";

const A = "A".charCodeAt(0);
const Z = "Z".charCodeAt(0);

function camelCaseToSkewerCase(camelcase: string) {
  const splits: string[] = [];

  let working = "";
  for (const char of camelcase) {
    const charCode = char.charCodeAt(0);
    if (charCode >= A && charCode <= Z) {
      splits.push(working);
      working = "";
    }
    working += char.toLowerCase();
  }

  splits.push(working);

  return splits.join("-");
}

class StyleConverter extends AuxVisitor {
  auxVisitJSXAttribute(
    n: JSXAttribute
  ): [JSXAttributeOrSpread, boolean] | undefined {
    if (
      n.name.type !== "Identifier" ||
      n.name.value !== "style" ||
      n.value?.type !== "JSXExpressionContainer" ||
      n.value.expression.type !== "ObjectExpression"
    )
      return;

    const styleObj = n.value.expression;

    for (let i = 0; i < styleObj.properties.length; i++) {
      const prop = styleObj.properties[i];

      if (prop.type === "KeyValueProperty" && prop.key.type === "Identifier")
        prop.key = emitStringLiteral(camelCaseToSkewerCase(prop.key.value));

      if (prop.type === "Identifier")
        styleObj.properties[i] = {
          type: "KeyValueProperty",
          key: emitStringLiteral(camelCaseToSkewerCase(prop.value)),
          value: emitIdentifier(prop.value),
        };
    }

    return [n, true];
  }
}

export default (node: BlockStatement) =>
  new StyleConverter().visitBlockStatement(node);
