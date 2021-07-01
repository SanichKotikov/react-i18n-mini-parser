import ts from 'typescript';
import type { Messages } from './types';

type JsxElement = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

export function isString(node: ts.Node): node is (ts.StringLiteral | ts.NoSubstitutionTemplateLiteral) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

export function isJsx(node: ts.Node): node is JsxElement {
  return ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node);
}

export function getName(node: ts.CallExpression | JsxElement): string {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) return node.expression.name.text;
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) return node.expression.text;
  if (isJsx(node) && ts.isIdentifier(node.tagName)) return node.tagName.text;
  return '';
}

export function concatString({ left, right }: ts.BinaryExpression): [result: string, isStatic: boolean] {
  if (!ts.isStringLiteral(right)) return ['', false];
  if (ts.isStringLiteral(left)) return [left.text + right.text, true];
  if (ts.isBinaryExpression(left)) {
    const [result, isStatic] = concatString(left);
    return [result + right.text, isStatic];
  }
  return ['', false];
}

export function sort(messages: Readonly<Messages>): Readonly<Messages> {
  return Object.keys(messages)
    .sort((a, b) => a.localeCompare(b))
    .reduce<Messages>((acc, key) => {
      acc[key] = messages[key]!;
      return acc;
    }, {});
}
