// let the games begin! - context aware (ish) recursive transform to make value accesses a call

import {
  Expression,
  Identifier,
  JSXAttributeOrSpread,
  JSXExpressionContainer,
  JSXOpeningElement,
  JSXSpreadChild,
  Statement,
} from "@swc/core";
import { emitCallExpression } from "./emitters.js";

const callify =
  (callifyList: string[]) =>
  (
    node: Exclude<
      | Expression
      | Statement
      | JSXExpressionContainer
      | JSXSpreadChild
      | JSXAttributeOrSpread
      | JSXOpeningElement,
      Identifier
    >
  ) => {
    const currentCallify = callify(callifyList);

    const isCallifiableIdentifier = (ident: Expression): ident is Identifier =>
      ident.type === "Identifier" && callifyList.includes(ident.value);

    switch (node.type) {
      case "BlockStatement":
        node.stmts.forEach(currentCallify);
        return;
      case "ExpressionStatement":
      case "JSXExpressionContainer":
      case "JSXSpreadChild":
      case "ParenthesisExpression":
        if (isCallifiableIdentifier(node.expression))
          node.expression = emitCallExpression(node.expression);
        else currentCallify(node.expression);
        return;
      case "ReturnStatement":
        if (isCallifiableIdentifier(node.argument))
          node.argument = emitCallExpression(node.argument);
        else currentCallify(node.argument);
        return;

      case "JSXFragment":
        node.children.forEach(currentCallify);
        return;

      case "JSXAttribute":
        if (node.value) currentCallify(node.value);
        return;

      case "JSXElement":
        currentCallify(node.opening);
        node.children.forEach(currentCallify);
        return;

      case "JSXOpeningElement":
        node.attributes?.forEach(currentCallify);
        return;

      case "SpreadElement":
        if (isCallifiableIdentifier(node.arguments))
          node.arguments = emitCallExpression(node.arguments);
        else currentCallify(node.arguments);
        return;

      case "JSXElement":
        node.opening.attributes?.forEach(currentCallify);
        return;

      case "BinaryExpression":
        if (isCallifiableIdentifier(node.left))
          node.left = emitCallExpression(node.left);
        else currentCallify(node.left);
        if (isCallifiableIdentifier(node.right))
          node.right = emitCallExpression(node.right);
        else currentCallify(node.right);
        return;

      case "CallExpression":
        node.arguments.forEach((a) => {
          if (isCallifiableIdentifier(a.expression))
            a.expression = emitCallExpression(a.expression);
          else currentCallify(a.expression);
        });
        return;

      case "VariableDeclaration":
        // shadows previous decls, or fails at runtime due to re-declaration
        // the first of these scenarios requires ignoring those values from now on
        // the second scenario, it really doesn't matter either way!
        const vdNewCallifyList = callifyList.filter(
          (n) =>
            !node.declarations.some(
              (d) => d.id.type === "Identifier" && d.id.value === n
            )
        );
        node.declarations.forEach((d) => {
          if (!d.init) return;
          if (isCallifiableIdentifier(d.init))
            d.init = emitCallExpression(d.init);
          else callify(vdNewCallifyList)(d.init);
        });
        return;

      case "ArrowFunctionExpression":
      case "FunctionExpression":
      case "FunctionDeclaration":
        // shadows
        const afNewCallifyList = callifyList.filter(
          (n) =>
            !node.params.some((p) => p.type === "Identifier" && p.value === n)
        );
        if (
          node.body.type !== "BlockStatement" &&
          isCallifiableIdentifier(node.body)
        )
          node.body = emitCallExpression(node.body);
        else callify(afNewCallifyList)(node.body);
        return;

      default:
        return;
    }
  };

export default (node: Expression | Statement, callifyList: string[]) =>
  node.type !== "Identifier" && callify(callifyList)(node);
