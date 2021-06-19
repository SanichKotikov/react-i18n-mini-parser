import ts from 'typescript';

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
